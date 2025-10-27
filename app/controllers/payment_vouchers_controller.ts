import type { HttpContext } from '@adonisjs/core/http'
import PaymentVoucher from '#models/payment_voucher'
import Transaction from '#models/transaction'
import Subscription from '#models/subscription'
import SubscriptionCard from '#models/subscription_card'
import SubscriptionType from '#models/subscription_type'
import { VoucherStatus, SubscriptionStatus, SubscriberCategory } from '#enums/library_enums'
import { generateVoucherPDF } from '#services/pdf/payment_pdfs'
import { generateSubscriptionCardPDF } from '#services/pdf/subscription_card_pdf'
import { generateVoucherValidator } from '#validators/payment_voucher'
import path from 'node:path'
import QRCode from 'qrcode'
import fs from 'node:fs'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import { randomUUID } from 'node:crypto'

export default class PaymentVouchersController {
    /**
     * Générer un bon de paiement
     * - Ne crée pas de doublon si un bon EN_ATTENTE existe encore pour la même durée
     * - Génère un PDF à la volée sans le sauvegarder définitivement
     */
    async generateVoucher({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            const { duration, bank } = await request.validateUsing(generateVoucherValidator)
            const category = (user.category ?? SubscriberCategory.STUDENT) as SubscriberCategory

            //Trouve la formule correspondante (3, 6, 12 mois)
            const type = await SubscriptionType.query()
                .where('is_active', true)
                .where('category', category)
                .where('duration_months', duration)
                .first()

            if (!type) {
                return response.badRequest({
                    message: `Aucun tarif trouvé pour ${category} (${duration} mois).`,
                })
            }

            // Vérifie s’il existe déjà un bon en attente ou actif
            const existingVoucher = await PaymentVoucher.query()
                .where('subscriber_id', user.id)
                .where('subscription_type_id', type.id)
                .whereIn('status', [VoucherStatus.EN_ATTENTE])
                .orderBy('created_at', 'desc')
                .first()

            // Prépare le dossier temporaire
            const tmpDir = path.resolve('tmp/vouchers')
            fs.mkdirSync(tmpDir, { recursive: true })

            let voucher = existingVoucher
            let referenceCode = existingVoucher?.referenceCode || `BON-${Date.now()}`
            let createdAt = existingVoucher?.createdAt || DateTime.now()
            let amount = type.price

            // Si aucun bon valide, en créer un nouveau
            if (!existingVoucher) {
                voucher = await PaymentVoucher.create({
                    referenceCode,
                    bankReceiptNumber: bank,
                    amount,
                    status: VoucherStatus.EN_ATTENTE,
                    subscriberId: user.id,
                    subscriptionTypeId: type.id,
                })
            }

            // Génération du QR + PDF (à la volée)
            const qrPath = path.join(tmpDir, `qrcode_${referenceCode}.png`)
            const pdfPath = path.join(tmpDir, `voucher_${referenceCode}.pdf`)

            await QRCode.toFile(qrPath, referenceCode, { width: 250 })

            await generateVoucherPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${user.firstName} ${user.lastName}`,
                    category,
                    duration: type.durationMonths,
                    bank,
                    amount,
                    reference: referenceCode,
                    qrCodePath: qrPath,
                    createdAt: createdAt.toFormat('dd/MM/yyyy'),
                },
            })

            // Envoi direct du fichier PDF
            response.header('Content-Disposition', `attachment; filename="${referenceCode}.pdf"`)
            response.type('application/pdf')
            await response.download(pdfPath)

            //Nettoyage automatique après 3 secondes
            setTimeout(() => {
                fs.rmSync(tmpDir, { recursive: true, force: true })
            }, 3000)
        } catch (error) {
            console.error('[ERREUR GENERATION BON]:', error)
            return handleError(response, error, 'Erreur lors de la génération du bon de paiement.')
        }
    }

    /**
     *  Validation du paiement
     * - Met à jour le bon
     * - Crée l’abonnement actif
     * - Génère la carte immédiatement active
     */
    async validatePayment({ params, response }: HttpContext) {
        try {
            console.log('--- DÉBUT VALIDATION DU PAIEMENT ---')

            //Récupération du bon de paiement
            const voucher = await PaymentVoucher.query()
                .where('id', params.id)
                .preload('subscriber')
                .preload('subscriptionType')
                .firstOrFail()

            const bankReference = 'Rawbank'
            const bankStatus = VoucherStatus.PAYE

            //Vérifie si déjà validé
            if (voucher.status === VoucherStatus.PAYE) {
                return response.badRequest({ message: 'Ce bon est déjà validé.' })
            }

            //Vérifie si l’abonné a déjà un abonnement valide ou non expiré
            const activeSubscription = await Subscription.query()
                .where('subscriber_id', voucher.subscriberId)
                .where((q) => {
                    q.where('status', SubscriptionStatus.VALIDE).andWhere(
                        'end_date',
                        '>',
                        DateTime.now().toSQL(),
                    )
                })
                .first()

            if (activeSubscription) {
                return response.badRequest({
                    message:
                        'Cet abonné possède déjà un abonnement actif ou non expiré. Veuillez attendre son expiration avant d’en créer un nouveau.',
                })
            }

            // Enregistre la transaction bancaire
            await Transaction.create({
                bankReference,
                bankStatus,
                transactionDate: DateTime.now(),
                paymentVoucherId: voucher.id,
            })
            console.log(`Transaction enregistrée (${bankReference})`)

            //Met à jour le statut du bon
            voucher.merge({ status: VoucherStatus.PAYE, validatedAt: DateTime.now() })
            await voucher.save()

            // Création de l’abonnement immédiatement actif
            const startDate = DateTime.now()
            const endDate = startDate.plus({ months: voucher.subscriptionType.durationMonths })

            const subscription = await Subscription.create({
                startDate,
                endDate,
                status: SubscriptionStatus.VALIDE,
                paymentVoucherId: voucher.id,
                subscriberId: voucher.subscriberId,
            })

            //Génération du QR code et du PDF
            const uniqueCode = `CARD-${randomUUID()}`
            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`
            const cardDir = path.resolve('tmp/cards')
            fs.mkdirSync(cardDir, { recursive: true })

            const qrPath = path.join(cardDir, `qrcode_card_${uniqueCode}.png`)
            const pdfPath = path.join(cardDir, `sub_card_${uniqueCode}.pdf`)

            console.log('Génération du QR code...')
            await QRCode.toFile(qrPath, verifyUrl, { width: 250 })
            const qrBase64 = await QRCode.toDataURL(verifyUrl)
            console.log('QR code généré :', qrPath)

            //Création de la carte d’abonnement
            const issuedAt = DateTime.now()
            const card = await SubscriptionCard.create({
                subscriptionId: subscription.id,
                uniqueCode,
                issuedAt,
                expiresAt: endDate,
                isActive: true,
                qrCodePath: qrPath,
                pdfPath: pdfPath,
                qrCodeBase64: qrBase64,
            })

            //Nettoyage différé des fichiers temporaires
            setTimeout(() => {
                try {
                    fs.rmSync(cardDir, { recursive: true, force: true })
                    console.log('Dossier temporaire supprimé :', cardDir)
                } catch (err) {
                    console.error('Erreur lors du nettoyage :', err)
                }
            }, 10000)

            // Réponse finale
            return response.ok({
                message: 'Paiement validé — Abonnement et carte activés automatiquement.',
                voucher,
                subscription,
                card,
                qr_preview: qrBase64,
            })
        } catch (error) {
            console.error('Erreur validatePayment:', error)
            return handleError(response, error, 'Erreur lors de la validation du paiement.')
        }
    }

    /**
     *  Liste des formules actives (publique)
     */
    async listActiveFormulas({ response }: HttpContext) {
        try {
            const data = await SubscriptionType.query()
                .where('is_active', true)
                .select(['id', 'category', 'duration_months', 'price'])

            return response.ok({ status: 'success', data })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des formules.')
        }
    }

    async listValidSubscriptions({ request, response }: HttpContext) {
        try {
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))
            const search = (request.input('search', '') as string).trim().toLowerCase()

            const now = DateTime.now()

            const query = Subscription.query()
                .where('status', SubscriptionStatus.VALIDE)
                .where('end_date', '>', now.toSQL()) // encore actif
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .orderBy('start_date', 'desc')

            if (search) {
                query.whereHas('subscriber', (q) => {
                    q.whereILike('first_name', `%${search}%`)
                        .orWhereILike('last_name', `%${search}%`)
                        .orWhereILike('email', `%${search}%`)
                        .orWhereILike('phone_number', `%${search}%`)
                })
            }

            const subscriptions = await query.paginate(page, limit)

            const data = subscriptions.map((sub) => ({
                subscriber: {
                    id: sub.subscriber.id,
                    firstName: sub.subscriber.firstName,
                    lastName: sub.subscriber.lastName,
                    email: sub.subscriber.email,
                    phoneNumber: sub.subscriber.phoneNumber,
                    category: sub.subscriber.category,
                },
                subscription: {
                    id: sub.id,
                    startDate: sub.startDate.toFormat('dd/MM/yyyy'),
                    endDate: sub.endDate.toFormat('dd/MM/yyyy'),
                    status: sub.status,
                    createdAt: sub.createdAt.toFormat('dd/MM/yyyy HH:mm'),
                },
                voucher: {
                    reference: sub.paymentVoucher.referenceCode,
                    amount: sub.paymentVoucher.amount,
                    duration: sub.paymentVoucher.subscriptionType.durationMonths,
                    status: sub.paymentVoucher.status,
                },
            }))

            return response.ok({
                status: 'success',
                message: 'Liste des abonnés valides',
                data,
                meta: subscriptions.getMeta(),
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des abonnés valides.')
        }
    }
}
