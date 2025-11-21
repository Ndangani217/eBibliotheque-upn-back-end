import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import { SubscriptionStatus } from '#enums/library_enums'

export default class SubscriptionController {
    /**
     *Lister tous les abonnés dont l’abonnement est encore valide
     * (statut = "valide" et date de fin > maintenant)
     */
    async listValidSubscriptions({ request, response }: HttpContext) {
        try {
            const page = Number(request.input('page', 1))
            const limit = Number(request.input('limit', 10))
            const category = request.input('category')
            const search = (request.input('search', '') as string).trim().toLowerCase()

            const now = DateTime.now()

            const query = Subscription.query()
                .where('status', SubscriptionStatus.VALIDE)
                .where('end_date', '>', now.toSQL())
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .orderBy('start_date', 'desc')

            //Filtre par catégorie (optionnel)
            if (category) {
                query.whereHas('subscriber', (q) => q.where('category', category))
            }

            //Recherche par nom/email/téléphone
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
                message: 'Liste des abonnés avec abonnement valide',
                data,
                meta: subscriptions.getMeta(),
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement des abonnés valides.')
        }
    }
}
