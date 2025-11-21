/**
 * Service de gestion des abonnements
 */
import Subscription from '#models/subscription'
import PaymentVoucher from '#models/payment_voucher'
import { SubscriptionStatus } from '#enums/library_enums'
import { DateTime } from 'luxon'

export interface CreateSubscriptionPayload {
    paymentVoucherId: number
    subscriberId: string
    validatedBy?: string
}

export class SubscriptionService {
    /**
     * Crée un abonnement à partir d'un bon de paiement validé
     */
    static async createSubscription(payload: CreateSubscriptionPayload) {
        const { paymentVoucherId, subscriberId, validatedBy } = payload

        // Récupère le bon de paiement
        const voucher = await PaymentVoucher.query()
            .where('id', paymentVoucherId)
            .preload('subscriptionType')
            .firstOrFail()

        // Vérifie si l'abonné a déjà un abonnement actif
        const activeSubscription = await Subscription.query()
            .where('subscriber_id', subscriberId)
            .where((q) => {
                q.where('status', SubscriptionStatus.VALIDE).andWhere(
                    'end_date',
                    '>',
                    DateTime.now().toSQL(),
                )
            })
            .first()

        if (activeSubscription) {
            throw new Error(
                "Cet abonné possède déjà un abonnement actif ou non expiré. Veuillez attendre son expiration avant d'en créer un nouveau.",
            )
        }

        // Calcule les dates
        const startDate = DateTime.now()
        const endDate = startDate.plus({ months: voucher.subscriptionType.durationMonths })

        // Crée l'abonnement
        const subscription = await Subscription.create({
            startDate,
            endDate,
            status: SubscriptionStatus.VALIDE,
            paymentVoucherId: voucher.id,
            subscriberId,
            validatedBy: validatedBy || null,
        })

        return subscription
    }

    /**
     * Liste les abonnements avec filtres
     */
    static async listSubscriptions(options: {
        status?: string
        search?: string
        page?: number
        limit?: number
    }) {
        const { status, search = '', page = 1, limit = 10 } = options

        const query = Subscription.query()
            .preload('subscriber')
            .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
            .orderBy('created_at', 'desc')

        if (status) {
            query.where('status', status)
        }

        if (search) {
            query.where((q) => {
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
        }

        return await query.paginate(page, limit)
    }

    /**
     * Suspend un abonnement
     */
    static async suspendSubscription(id: string) {
        const subscription = await Subscription.find(id)

        if (!subscription) {
            throw new Error('Subscription not found')
        }

        if (subscription.status !== SubscriptionStatus.VALIDE) {
            throw new Error('Seuls les abonnements actifs peuvent être suspendus')
        }

        subscription.status = SubscriptionStatus.SUSPENDU
        await subscription.save()

        return subscription
    }

    /**
     * Récupère les abonnements expirant bientôt
     */
    static async getExpiringSoon(days: number = 7) {
        const nextWeek = DateTime.now().plus({ days })
        const subscriptions = await Subscription.query()
            .where('end_date', '<=', nextWeek.toISO())
            .where('status', SubscriptionStatus.VALIDE)
            .preload('subscriber')

        return subscriptions
    }
}
