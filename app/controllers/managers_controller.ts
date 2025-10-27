import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import Subscription from '#models/subscription'
import PaymentVoucher from '#models/payment_voucher'
import SubscriptionCard from '#models/subscription_card'
import { handleError } from '#helpers/handle_error'
import { generateSubscriptionCardPDF } from '#services/pdf/subscription_card_pdf'
import path from 'node:path'
import fs from 'node:fs'
import QRCode from 'qrcode'
import { UserRole, VoucherStatus, SubscriptionStatus, CardStatus } from '#enums/library_enums'

export default class ManagerController {
    /**
     *Tableau de bord Manager
     */
    async dashboard({ response }: HttpContext) {
        try {
            const totalSubscribers = await User.query()
                .where('role', UserRole.SUBSCRIBER)
                .count('* as total')

            const activeSubscriptions = await Subscription.query()
                .where('status', SubscriptionStatus.VALIDE)
                .count('* as total')

            const expiredSubscriptions = await Subscription.query()
                .where('status', SubscriptionStatus.EXPIRE)
                .count('* as total')

            const validatedPayments = await PaymentVoucher.query()
                .where('status', VoucherStatus.PAYE)
                .count('* as total')

            const pendingPayments = await PaymentVoucher.query()
                .where('status', VoucherStatus.EN_ATTENTE)
                .count('* as total')

            return response.ok({
                status: 'success',
                message: 'Statistiques du tableau de bord manager',
                data: {
                    totalSubscribers: Number(totalSubscribers[0].$extras.total),
                    activeSubscriptions: Number(activeSubscriptions[0].$extras.total),
                    expiredSubscriptions: Number(expiredSubscriptions[0].$extras.total),
                    validatedPayments: Number(validatedPayments[0].$extras.total),
                    pendingPayments: Number(pendingPayments[0].$extras.total),
                },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de charger les statistiques du manager')
        }
    }

    /**
     * Liste des paiements (en attente, payés, etc.)
     */
    async payments({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const search = request.input('search', '').trim()
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))

            const query = PaymentVoucher.query()
                .preload('subscriber')
                .preload('subscriptionType')
                .orderBy('created_at', 'desc')
                .if(status, (q) => q.where('status', status))
                .if(search, (q) =>
                    q
                        .whereILike('reference_code', `%${search}%`)
                        .orWhereHas('subscriber', (sub) =>
                            sub
                                .whereILike('first_name', `%${search}%`)
                                .orWhereILike('last_name', `%${search}%`),
                        ),
                )

            const paginated = await query.paginate(page, limit)
            const data = paginated.toJSON().data

            const formatted = data.map((p) => ({
                id: p.id,
                referenceCode: p.referenceCode,
                subscriberName:
                    `${p.subscriber?.firstName ?? ''} ${p.subscriber?.lastName ?? ''}`.trim(),
                category: p.subscriptionType?.category ?? '—',
                amount: Number(p.amount).toFixed(2),
                status: p.status,
                validatedAt: p.validatedAt,
                createdAt: p.createdAt,
            }))

            return response.ok({
                status: 'success',
                message: 'Liste des bons de paiement',
                data: formatted,
                meta: paginated.getMeta(),
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({
                status: 'error',
                message: 'Erreur lors du chargement des paiements',
            })
        }
    }

    /**
     *Liste des abonnements actifs / expirés, suspendu
     */
    async subscriptions({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const search = request.input('search', '').trim()
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))

            //Construction de la requête
            const query = Subscription.query()
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .orderBy('created_at', 'desc')
                .if(status, (q) => q.where('status', status))
                .if(search, (q) => {
                    q.whereHas('subscriber', (subQuery) =>
                        subQuery
                            .whereILike('first_name', `%${search}%`)
                            .orWhereILike('last_name', `%${search}%`),
                    ).orWhereHas('paymentVoucher', (pvQuery) =>
                        pvQuery.whereHas('subscriptionType', (stQuery) =>
                            stQuery.whereILike('category', `%${search}%`),
                        ),
                    )
                })

            //Pagination
            const paginated = await query.paginate(page, limit)
            const data = paginated.toJSON().data

            //Formatage
            const formatted = data.map((s) => ({
                id: s.id,
                subscriberName:
                    `${s.subscriber?.firstName ?? ''} ${s.subscriber?.lastName ?? ''}`.trim(),
                category: s.paymentVoucher?.subscriptionType?.category ?? '—',
                startDate: s.startDate,
                endDate: s.endDate,
                status: s.status,
            }))

            //Réponse standardisée
            return response.ok({
                status: 'success',
                message: 'Liste des abonnements',
                data: formatted,
                meta: paginated.getMeta(),
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({
                status: 'error',
                message: 'Erreur lors du chargement des abonnements',
            })
        }
    }

    /**
     *Liste des cartes d’abonnement
     */
    async cards({ request, response }: HttpContext) {
        try {
            //Récupération des filtres
            const status = request.input('status') // 'active' | 'inactive'
            const search = request.input('search', '').trim()
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))

            const query = SubscriptionCard.query()
                .preload('subscription', (sub) =>
                    sub
                        .preload('subscriber')
                        .preload('paymentVoucher', (pv) => pv.preload('subscriptionType')),
                )
                .orderBy('created_at', 'desc')

            if (status === 'active') query.where('is_active', true)
            if (status === 'inactive') query.where('is_active', false)

            if (search) {
                query.whereHas('subscription', (subQuery) => {
                    subQuery.whereHas('subscriber', (subscriberQuery) => {
                        subscriberQuery
                            .whereILike('first_name', `%${search}%`)
                            .orWhereILike('last_name', `%${search}%`)
                            .orWhereILike('email', `%${search}%`)
                    })
                })
            }

            const paginated = await query.paginate(page, limit)
            const data = paginated.toJSON().data

            const formatted = data.map((c) => ({
                id: c.id,
                uniqueCode: c.uniqueCode,
                subscriberName: `${c.subscription?.subscriber?.firstName ?? ''} ${
                    c.subscription?.subscriber?.lastName ?? ''
                }`.trim(),
                subscriberEmail: c.subscription?.subscriber?.email ?? '—',
                category: c.subscription?.paymentVoucher?.subscriptionType?.category ?? '—',
                issuedAt: c.issuedAt,
                expiresAt: c.expiresAt,
                status: c.isActive ? CardStatus.ACTIVE : CardStatus.INACTIVE,
                pdfPath: c.pdfPath,
            }))

            return response.ok({
                status: 'success',
                message: 'Liste des cartes d’abonnement',
                data: formatted,
                meta: paginated.getMeta(),
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des cartes')
        }
    }

    /**
     * Activation d’une carte
     */
    async activateCard({ params, response }: HttpContext) {
        try {
            const card = await SubscriptionCard.findOrFail(params.id)
            card.isActive = true
            await card.save()

            return response.ok({
                status: 'success',
                message: 'Carte activée avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Impossible d’activer la carte')
        }
    }

    /**
     *Impression PDF d’une carte
     */
    async printCard({ params, response }: HttpContext) {
        try {
            const card = await SubscriptionCard.query()
                .where('id', params.id)
                .preload('subscription', (sub) =>
                    sub
                        .preload('subscriber')
                        .preload('paymentVoucher', (pv) => pv.preload('subscriptionType')),
                )
                .firstOrFail()

            const subscription = card.subscription
            const subscriber = subscription.subscriber
            const type = subscription.paymentVoucher.subscriptionType

            // Vérifie si la carte est valide
            if (!card.isActive) {
                return response.badRequest({ message: 'Cette carte est inactive.' })
            }

            const now = DateTime.now()
            if (card.expiresAt < now) {
                return response.badRequest({ message: 'Cette carte est expirée.' })
            }

            // === Dossiers temporaires ===
            const tmpDir = path.resolve('tmp/cards')
            fs.mkdirSync(tmpDir, { recursive: true })

            const qrPath = path.join(tmpDir, `qr_${card.uniqueCode}.png`)
            const pdfPath = path.join(tmpDir, `card_${card.uniqueCode}.pdf`)
            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${card.uniqueCode}`

            await QRCode.toFile(qrPath, verifyUrl, { width: 250 })

            await generateSubscriptionCardPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${subscriber.firstName} ${subscriber.lastName}`,
                    email: subscriber.email,
                    phoneNumber: subscriber.phoneNumber,
                    category: type.category,
                    startDate: card.issuedAt.toFormat('dd/MM/yyyy'),
                    endDate: card.expiresAt.toFormat('dd/MM/yyyy'),
                    reference: card.uniqueCode,
                    qrCodePath: qrPath,
                },
            })

            // Téléchargement direct
            response.header(
                'Content-Disposition',
                `attachment; filename="carte-${card.uniqueCode}.pdf"`,
            )
            response.type('application/pdf')
            await response.download(pdfPath)

            // Nettoyage automatique après 3 sec
            setTimeout(() => {
                fs.rmSync(tmpDir, { recursive: true, force: true })
            }, 3000)
        } catch (error) {
            console.error('Erreur impression carte:', error)
            return handleError(response, error, 'Erreur lors de la génération du PDF de la carte.')
        }
    }

    //Abonnements expirant dans les 7 prochains jours
    async expiringSoon({ response }: HttpContext) {
        try {
            const nextWeek = DateTime.now().plus({ days: 7 })
            const subscriptions = await Subscription.query()
                .where('end_date', '<=', nextWeek.toISO())
                .where('status', SubscriptionStatus.VALIDE)
                .preload('subscriber')

            const formatted = subscriptions.map((s) => ({
                id: s.id,
                subscriberName: `${s.subscriber?.firstName ?? ''} ${s.subscriber?.lastName ?? ''}`,
                endDate: s.endDate.toFormat('dd/MM/yyyy'),
            }))

            return response.ok({
                status: 'success',
                message: 'Abonnements expirant dans les 7 prochains jours',
                data: formatted,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors du chargement des abonnements expirant bientôt.',
            )
        }
    }

    /**
     * Suspendre un abonnement actif
     */
    async suspendCard({ params, response }: HttpContext) {
        try {
            const id = params.id

            const subscription = await Subscription.find(id)
            if (!subscription) {
                return response.notFound({
                    status: 'error',
                    message: 'Abonnement introuvable',
                })
            }

            if (subscription.status !== SubscriptionStatus.VALIDE) {
                return response.badRequest({
                    status: 'error',
                    message: 'Seuls les abonnements actifs peuvent être suspendus',
                })
            }
            subscription.status = SubscriptionStatus.SUSPENDU
            await subscription.save()
            return response.ok({
                status: 'success',
                message: 'Abonnement suspendu avec succès',
                data: {
                    id: subscription.id,
                    newStatus: subscription.status,
                },
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({
                status: 'error',
                message: "Erreur lors de la suspension de l'abonnement",
            })
        }
    }
}
