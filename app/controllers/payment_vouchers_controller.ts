import type { HttpContext } from '@adonisjs/core/http'
import PaymentVoucher from '#models/payment_voucher'
import Transaction from '#models/transaction'
import Subscription from '#models/subscription'
import SubscriptionCard from '#models/subscription_card'
import SubscriptionType from '#models/subscription_type'
import { VoucherStatus, SubscriptionStatus, SubscriberCategory } from '#enums/library_enums'
import { generateVoucherPDF } from '#services/pdf/payment_pdfs'
import { generateVoucherValidator } from '#validators/payment_voucher'
import path from 'node:path'
import QRCode from 'qrcode'
import fs from 'node:fs'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import { getAuthenticatedUser } from '#helpers/auth_helper'
import { getActiveSubscription } from '#helpers/subscription_helper'
import { downloadPDF } from '#helpers/file_helper'
import { randomUUID } from 'node:crypto'

export default class PaymentVouchersController {
    /**
     * Générer un bon de paiement
     * - Ne crée pas de doublon si un bon EN_ATTENTE existe encore pour la même durée
     * - Permet de générer des bons pour différentes durées (3, 6, 12 mois)
     * - Génère un PDF à la volée sans le sauvegarder définitivement
     */
    async generateVoucher({ auth, request, response }: HttpContext) {
        try {
            const user = getAuthenticatedUser(auth, response)
            if (!user) return

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

            // Vérifie si l'abonné a déjà un abonnement actif (non expiré)
            const activeSubscription = await getActiveSubscription(user.id)
            if (activeSubscription) {
                return response.badRequest({
                    message:
                        'Vous avez déjà un abonnement actif. Veuillez attendre son expiration avant de générer un nouveau bon de paiement.',
                    subscription: {
                        id: activeSubscription.id,
                        startDate: activeSubscription.startDate.toFormat('dd/MM/yyyy'),
                        endDate: activeSubscription.endDate.toFormat('dd/MM/yyyy'),
                        status: activeSubscription.status,
                    },
                })
            }

            // Vérifie s'il existe déjà un bon actif (non expiré) pour cette durée spécifique
            // Un abonné peut avoir un bon actif par durée (3, 6, 12 mois)
            const now = DateTime.now()
            const existingVoucher = await PaymentVoucher.query()
                .where('subscriber_id', user.id)
                .where('subscription_type_id', type.id)
                .where('status', VoucherStatus.EN_ATTENTE)
                .where((query) => {
                    query.whereNull('expires_at').orWhere('expires_at', '>', now.toSQL())
                })
                .preload('subscriptionType')
                .orderBy('created_at', 'desc')
                .first()

            // Si un bon actif existe pour cette durée, retourner une erreur
            if (existingVoucher) {
                return response.badRequest({
                    message:
                        `Vous avez déjà un bon de paiement actif pour la formule de ${duration} mois. Veuillez attendre son expiration avant d'en générer un nouveau pour cette durée.`,
                    voucher: {
                        id: existingVoucher.id,
                        referenceCode: existingVoucher.referenceCode,
                        amount: existingVoucher.amount,
                        createdAt: existingVoucher.createdAt.toFormat('dd/MM/yyyy'),
                        expiresAt: existingVoucher.expiresAt?.toFormat('dd/MM/yyyy') || null,
                        status: existingVoucher.status,
                        duration: existingVoucher.subscriptionType.durationMonths,
                    },
                })
            }

            // Prépare le dossier temporaire
            const tmpDir = path.resolve('tmp/vouchers')
            fs.mkdirSync(tmpDir, { recursive: true })

            // Créer un nouveau bon
            const referenceCode = `BON-${Date.now()}`
            const createdAt = DateTime.now()
            const amount = type.price
            const expiresAt = DateTime.now().plus({ days: 30 })

            await PaymentVoucher.create({
                    referenceCode,
                    bankReceiptNumber: bank,
                    amount,
                    status: VoucherStatus.EN_ATTENTE,
                    subscriberId: user.id,
                    subscriptionTypeId: type.id,
                expiresAt,
                })

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
            await downloadPDF(response, pdfPath, `${referenceCode}.pdf`)
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

            //Vérifie si l'abonné a déjà un abonnement valide ou non expiré
            const activeSubscription = await getActiveSubscription(voucher.subscriberId)
            if (activeSubscription) {
                return response.badRequest({
                    message:
                        "Cet abonné possède déjà un abonnement actif ou non expiré. Veuillez attendre son expiration avant d'en créer un nouveau.",
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

            // Expire automatiquement tous les autres bons de l'abonné qui sont encore en attente
            const otherVouchers = await PaymentVoucher.query()
                .where('subscriber_id', voucher.subscriberId)
                .where('id', '!=', voucher.id)
                .where('status', VoucherStatus.EN_ATTENTE)

            let expiredCount = 0
            for (const otherVoucher of otherVouchers) {
                otherVoucher.status = VoucherStatus.EXPIRE
                await otherVoucher.save()
                expiredCount++
            }

            if (expiredCount > 0) {
                console.log(
                    `${expiredCount} bon(s) de paiement expiré(s) automatiquement pour l'abonné ${voucher.subscriberId}`,
                )
            }

            // Création de l'abonnement immédiatement actif
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

    /**
     * Récupère le bon actif (non expiré) de l'utilisateur authentifié
     */
    async getActiveVoucher({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            const now = DateTime.now()
            const activeVoucher = await PaymentVoucher.query()
                .where('subscriber_id', user.id)
                .where('status', VoucherStatus.EN_ATTENTE)
                .where((query) => {
                    query.whereNull('expires_at').orWhere('expires_at', '>', now.toSQL())
                })
                .preload('subscriptionType')
                .orderBy('created_at', 'desc')
                .first()

            if (!activeVoucher) {
                return response.ok({
                    status: 'success',
                    data: null,
                    message: 'Aucun bon actif trouvé.',
                })
            }

            return response.ok({
                status: 'success',
                data: {
                    id: activeVoucher.id,
                    referenceCode: activeVoucher.referenceCode,
                    amount: activeVoucher.amount,
                    status: activeVoucher.status,
                    createdAt: activeVoucher.createdAt.toFormat('dd/MM/yyyy'),
                    expiresAt: activeVoucher.expiresAt?.toFormat('dd/MM/yyyy') || null,
                    duration: activeVoucher.subscriptionType.durationMonths,
                    category: activeVoucher.subscriptionType.category,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération du bon actif.')
        }
    }

    /**
     * Télécharge le PDF d'un bon de paiement existant
     */
    async downloadVoucher({ params, auth, response }: HttpContext) {
        try {
            const user = getAuthenticatedUser(auth, response)
            if (!user) return

            const voucher = await PaymentVoucher.query()
                .where('id', params.id)
                .where('subscriber_id', user.id)
                .preload('subscriptionType')
                .preload('subscriber')
                .firstOrFail()

            // Prépare le dossier temporaire
            const tmpDir = path.resolve('tmp/vouchers')
            fs.mkdirSync(tmpDir, { recursive: true })

            // Génération du QR code
            const qrPath = path.join(tmpDir, `qrcode_${voucher.referenceCode}.png`)
            const pdfPath = path.join(tmpDir, `voucher_${voucher.referenceCode}.pdf`)

            await QRCode.toFile(qrPath, voucher.referenceCode, { width: 250 })

            // Régénération du PDF avec les données du bon existant
            await generateVoucherPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${voucher.subscriber.firstName} ${voucher.subscriber.lastName}`,
                    category: voucher.subscriptionType.category,
                    duration: voucher.subscriptionType.durationMonths,
                    bank: voucher.bankReceiptNumber || 'Rawbank',
                    amount: voucher.amount,
                    reference: voucher.referenceCode,
                    qrCodePath: qrPath,
                    createdAt: voucher.createdAt.toFormat('dd/MM/yyyy'),
                },
            })

            // Envoi direct du fichier PDF
            await downloadPDF(response, pdfPath, `${voucher.referenceCode}.pdf`)
        } catch (error: any) {
            if (error.message === 'Row not found') {
                return response.notFound({ message: 'Bon de paiement non trouvé.' })
            }
            return handleError(response, error, 'Erreur lors du téléchargement du bon de paiement.')
        }
    }

    /**
     * Expire automatiquement les bons de paiement dont la date d'expiration est passée
     */
    async expireVouchers({ response }: HttpContext) {
        try {
            const now = DateTime.now()

            const expiredVouchers = await PaymentVoucher.query()
                .where('status', VoucherStatus.EN_ATTENTE)
                .whereNotNull('expires_at')
                .where('expires_at', '<=', now.toSQL())

            let expiredCount = 0
            for (const voucher of expiredVouchers) {
                voucher.status = VoucherStatus.EXPIRE
                await voucher.save()
                expiredCount++
            }

            return response.ok({
                status: 'success',
                message: `${expiredCount} bon(s) de paiement expiré(s).`,
                count: expiredCount,
            })
        } catch (error) {
            return handleError(response, error, "Erreur lors de l'expiration des bons.")
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
