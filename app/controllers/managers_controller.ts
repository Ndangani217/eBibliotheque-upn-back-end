import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'
import Subscription from '#models/subscription'
import PaymentVoucher from '#models/payment_voucher'
import SubscriptionCard from '#models/subscription_card'
import { handleError } from '#helpers/handle_error'
import { UserRole, VoucherStatus, SubscriptionStatus } from '#enums/library_enums'

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
     *Validation d’un paiement
     */
    async validatePayment({ params, response }: HttpContext) {
        try {
            const payment = await PaymentVoucher.query()
                .where('id', params.id)
                .preload('subscription')
                .firstOrFail()

            payment.status = VoucherStatus.PAYE
            payment.validatedAt = DateTime.now()
            await payment.save()

            // Si une carte existe pour l’abonnement lié
            if (payment.subscription) {
                const card = await SubscriptionCard.query()
                    .where('subscription_id', payment.subscription.id)
                    .first()

                if (card) {
                    card.isActive = true
                    await card.save()
                }
            }

            return response.ok({
                status: 'success',
                message: 'Paiement validé et carte activée avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de valider le paiement')
        }
    }

    /**
     *Liste des abonnements actifs / expirés
     */
    async subscriptions({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const subscriptions = await Subscription.query()
                .if(status, (query) => query.where('status', status))
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .orderBy('created_at', 'desc')

            const formatted = subscriptions.map((s) => ({
                id: s.id,
                subscriberName: `${s.subscriber?.firstName ?? ''} ${s.subscriber?.lastName ?? ''}`,
                category: s.paymentVoucher?.subscriptionType?.category,
                startDate: s.startDate,
                endDate: s.endDate,
                status: s.status,
            }))

            return response.ok({
                status: 'success',
                message: 'Liste des abonnements',
                data: formatted,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des abonnements')
        }
    }

    /**
     *Liste des cartes d’abonnement
     */
    async cards({ response }: HttpContext) {
        try {
            const cards = await SubscriptionCard.query()
                .preload('subscription', (sub) =>
                    sub
                        .preload('subscriber')
                        .preload('paymentVoucher', (pv) => pv.preload('subscriptionType')),
                )
                .orderBy('created_at', 'desc')

            const formatted = cards.map((c) => ({
                id: c.id,
                uniqueCode: c.uniqueCode,
                subscriberName: `${c.subscription?.subscriber?.firstName ?? ''} ${c.subscription?.subscriber?.lastName ?? ''}`,
                category: c.subscription?.paymentVoucher?.subscriptionType?.category,
                issuedAt: c.issuedAt,
                status: c.isActive ? 'active' : 'inactive',
                pdfPath: c.pdfPath,
            }))

            return response.ok({
                status: 'success',
                message: 'Liste des cartes d’abonnement',
                data: formatted,
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

            const pdfContent = `
            Carte d'abonnement - Bibliothèque UPN
            ----------------------------------------
            Nom : ${subscriber.firstName} ${subscriber.lastName}
            Catégorie : ${type.category}
            Date d'émission : ${card.issuedAt.toFormat('dd/MM/yyyy')}
            Valide jusqu'au : ${subscription.endDate.toFormat('dd/MM/yyyy')}
            Code unique : ${card.uniqueCode}
            `

            response.header('Content-Type', 'application/pdf')
            response.header('Content-Disposition', `attachment; filename=carte-${card.id}.pdf`)
            return response.send(pdfContent)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération du PDF')
        }
    }

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
}
