import type { HttpContext } from '@adonisjs/core/http'
import PaymentVoucher from '#models/payment_voucher'
import Transaction from '#models/transaction'
import Subscription from '#models/subscription'
import SubscriptionCard from '#models/subscription_card'
import SubscriptionType from '#models/subscription_type'
import { VoucherStatus, SubscriptionStatus, SubscriberCategory } from '#enums/library_enums'
import { generateVoucherPDF, generateReceiptPDF } from '#services/pdf/payment_pdfs'
import { generateSubscriptionCardPDF } from '#services/pdf/subscription_card_pdf'
import path from 'node:path'
import QRCode from 'qrcode'
import fs from 'node:fs'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import { randomUUID } from 'node:crypto'

export default class PaymentVouchersController {
    /**
     *Générer un bon de paiement PDF
     */
    async generateVoucher({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user!
            const { category, duration, bank } = request.only(['category', 'duration', 'bank'])

            //Recherche du tarif dans la table SubscriptionType
            const type = await SubscriptionType.query()
                .where('category', category)
                .where('duration_months', duration)
                .first()

            if (!type) {
                return response.badRequest({
                    message: `Aucun tarif trouvé pour la catégorie "${category}" et la durée "${duration}" mois.`,
                })
            }

            //Création du dossier temporaire pour stocker les fichiers
            const tmpDir = path.resolve('tmp/vouchers')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

            //Génération du QR code et du PDF
            const referenceCode = `BON-${Date.now()}`
            const qrPath = path.resolve(tmpDir, `qrcode_${referenceCode}.png`)
            const pdfPath = path.resolve(tmpDir, `voucher_${referenceCode}.pdf`)

            await QRCode.toFile(qrPath, referenceCode, { width: 250 })

            //Création du bon de paiement en base
            const voucher = await PaymentVoucher.create({
                referenceCode,
                amount: type.price,
                category,
                duration: type.durationMonths,
                status: VoucherStatus.EN_ATTENTE,
                subscriberId: user.id,
                qrCode: qrPath,
            })

            //Génération du PDF du bon de paiement
            await generateVoucherPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${user.firstName} ${user.lastName}`,
                    category,
                    duration: type.durationMonths,
                    bank,
                    amount: type.price,
                    reference: voucher.referenceCode,
                    qrCodePath: qrPath,
                    createdAt: voucher.createdAt.toFormat('dd/MM/yyyy'),
                },
            })

            //Téléchargement du fichier
            response.header(
                'Content-Disposition',
                `attachment; filename="${voucher.referenceCode}.pdf"`,
            )
            await response.download(pdfPath)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération du bon de paiement.')
        } finally {
            //Nettoyage des fichiers temporaires
            fs.rmSync('tmp/vouchers', { recursive: true, force: true })
        }
    }

    /**
     *Validation du paiement → Création abonnement + carte
     */
    async validatePayment({ params, request, response }: HttpContext) {
        try {
            const voucher = await PaymentVoucher.query()
                .where('id', params.id)
                .preload('subscriber')
                .firstOrFail()

            const { bankReference, bankStatus } = request.only(['bankReference', 'bankStatus'])

            if (voucher.status === VoucherStatus.PAYE) {
                return response.badRequest({ message: 'Ce bon est déjà validé.' })
            }

            //Transaction bancaire
            await Transaction.create({
                bankReference,
                bankStatus,
                transactionDate: DateTime.now(),
                paymentVoucherId: voucher.id,
            })

            voucher.merge({ status: VoucherStatus.PAYE, validatedAt: DateTime.now() })
            await voucher.save()

            //Créer l’abonnement
            const startDate = DateTime.now()
            const endDate = startDate.plus({ months: voucher.duration })

            const subscription = await Subscription.create({
                startDate,
                endDate,
                status: SubscriptionStatus.VALIDE,
                paymentVoucherId: voucher.id,
                subscriberId: voucher.subscriberId,
            })

            //Génération de la carte d’abonnement (QR vers Next.js)
            const uniqueCode = `CARD-${randomUUID()}`
            const cardDir = path.resolve('tmp/cards')
            if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, { recursive: true })

            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`

            const qrPath = path.resolve(cardDir, `qrcode_card_${uniqueCode}.png`)
            const pdfPath = path.resolve(cardDir, `sub_card_${uniqueCode}.pdf`)
            await QRCode.toFile(qrPath, verifyUrl, { width: 250 })

            await generateSubscriptionCardPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${voucher.subscriber.firstName} ${voucher.subscriber.lastName}`,
                    category: voucher.category,
                    reference: voucher.referenceCode,
                    startDate: startDate.toFormat('dd/MM/yyyy'),
                    endDate: endDate.toFormat('dd/MM/yyyy'),
                    uniqueCode,
                    qrPath,
                },
            })

            await SubscriptionCard.create({
                subscriptionId: subscription.id,
                uniqueCode,
                issuedAt: DateTime.now(),
                isActive: true,
                qrCodePath: qrPath,
                pdfPath,
            })

            return response.ok({
                message: 'Paiement validé, abonnement activé et carte générée.',
                voucher,
                subscription,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la validation du paiement.')
        } finally {
            fs.rmSync('tmp/cards', { recursive: true, force: true })
        }
    }

    /**
     *Génération du reçu PDF
     */
    async generateReceipt({ params, response }: HttpContext) {
        try {
            const voucher = await PaymentVoucher.query()
                .where('id', params.id)
                .preload('subscriber')
                .preload('transactions')
                .firstOrFail()

            if (voucher.status !== VoucherStatus.PAYE) {
                return response.badRequest({ message: 'Le paiement n’est pas encore validé.' })
            }

            const transaction = voucher.transactions[0]
            const tmpDir = path.resolve('tmp/receipts')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

            const pdfPath = path.resolve(tmpDir, `receipt_${voucher.referenceCode}.pdf`)
            await generateReceiptPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${voucher.subscriber.firstName} ${voucher.subscriber.lastName}`,
                    category: voucher.category,
                    duration: voucher.duration,
                    amount: voucher.amount,
                    reference: voucher.referenceCode,
                    transactionId: transaction?.id || '—',
                    paymentDate: voucher.validatedAt?.toFormat('dd/MM/yyyy') || '—',
                    bank: transaction?.bankReference || '—',
                },
            })

            response.header(
                'Content-Disposition',
                `attachment; filename="recu_${voucher.referenceCode}.pdf"`,
            )
            await response.download(pdfPath)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération du reçu.')
        } finally {
            fs.rmSync('tmp/receipts', { recursive: true, force: true })
        }
    }

    /**
     * Liste paginée des bons de paiement
     */
    async index({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user!
            const status = request.input('status')
            const search = request.input('search', '').trim()
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))

            const query = PaymentVoucher.query()
                .where('subscriber_id', user.id)
                .preload('transactions')
                .orderBy('created_at', 'desc')

            if (status) query.andWhere('status', status)
            if (search) {
                query.andWhere((q) => {
                    q.whereILike('reference_code', `%${search}%`).orWhereILike(
                        'amount',
                        `%${search}%`,
                    )
                })
            }

            const vouchers = await query.paginate(page, limit)
            return response.ok(vouchers)
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des bons.')
        }
    }

    /**
     * Détails d’un bon
     */
    async show({ params, response }: HttpContext) {
        try {
            const voucher = await PaymentVoucher.query()
                .where('id', params.id)
                .preload('subscriber')
                .preload('transactions')
                .firstOrFail()

            return response.ok(voucher)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération du bon.')
        }
    }

    /**
     * Suppression d’un bon non payé
     */
    async delete({ params, response }: HttpContext) {
        try {
            const voucher = await PaymentVoucher.findOrFail(params.id)
            if (voucher.status === VoucherStatus.PAYE) {
                return response.badRequest({ message: 'Impossible de supprimer un bon déjà payé.' })
            }
            await voucher.delete()
            return response.ok({ message: 'Bon supprimé avec succès.' })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression du bon.')
        }
    }

    /**
     *  Réinitialisation du statut d’un bon
     */
    async resetStatus({ params, response }: HttpContext) {
        try {
            const voucher = await PaymentVoucher.findOrFail(params.id)
            voucher.merge({ status: VoucherStatus.EN_ATTENTE })
            await voucher.save()
            return response.ok({ message: 'Statut du bon réinitialisé.', voucher })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la réinitialisation du statut.')
        }
    }

    /**
     *Liste les formules selon la catégorie
     *
     */
    async listByCategory({ params, response }: HttpContext) {
        try {
            const category = params.category as SubscriberCategory
            if (!Object.values(SubscriberCategory).includes(category)) {
                return response.badRequest({ message: 'Catégorie invalide.' })
            }
            const subscriptionTypes =
                category === SubscriberCategory.STUDENT
                    ? [
                          { id: 1, category, duration: 3, price: 5, devise: 'USD' },
                          { id: 2, category, duration: 6, price: 10, devise: 'USD' },
                          { id: 3, category, duration: 9, price: 15, devise: 'USD' },
                      ]
                    : [
                          { id: 4, category, duration: 3, price: 10, devise: 'USD' },
                          { id: 5, category, duration: 6, price: 15, devise: 'USD' },
                          { id: 6, category, duration: 9, price: 20, devise: 'USD' },
                      ]

            return response.ok({
                status: 'success',
                message: 'Formules d’abonnement récupérées avec succès.',
                data: subscriptionTypes,
            })
        } catch (error) {
            return
            handleError(response, error, 'Erreur lors du chargement des formules.')
        }
    }
}
