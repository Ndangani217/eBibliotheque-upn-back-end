import { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { createSubscriptionValidator, updateSubscriptionValidator } from '#validators/subscription'
import { HandleError as handleError } from '#helpers/handleError'
import { DateTime } from 'luxon'
import { getExpiryRange } from '#helpers/dateRange'
import type { Period } from '#types/period'
import { SubscriptionStatus } from '#types/subscriptionStatus'

export default class SubscriptionsController {
    /** 🔹 Abonnement de l’étudiant connecté */
    async me({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) return response.unauthorized({ message: 'Non authentifié' })

            const subscription = await Subscription.query()
                .where('student_id', user.id)
                .preload('room', (r) => r.preload('students'))
                .preload('payments')
                .first()

            if (!subscription) {
                return response.notFound({
                    status: 'error',
                    message: 'Aucun abonnement trouvé pour cet étudiant',
                })
            }

            return response.ok({
                status: 'success',
                message: 'Abonnement récupéré avec succès',
                data: subscription,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération de l’abonnement')
        }
    }

    /** 🔹 Récupère tous les abonnements (avec pagination) */
    async getAllSubscriptions({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)

            const subscriptions = await Subscription.query()
                .preload('student')
                .preload('room')
                .preload('payments')
                .orderBy('created_at', 'desc')
                .paginate(page, limit)

            subscriptions.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: 'Abonnements récupérés avec succès',
                data: subscriptions,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des abonnements')
        }
    }

    /** 🔹 Récupère un abonnement par ID */
    async getByIdSubscription({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('id', params.id)
                .preload('student')
                .preload('room')
                .preload('payments')
                .firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Abonnement récupéré avec succès',
                data: subscription,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération de l’abonnement')
        }
    }

    /** 🔹 Crée un nouvel abonnement */
    async create({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createSubscriptionValidator)
            const subscription = await Subscription.create(payload)

            return response.created({
                status: 'success',
                message: 'Abonnement créé avec succès',
                data: subscription,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la création de l’abonnement')
        }
    }

    /** 🔹 Met à jour un abonnement */
    async update({ params, request, response }: HttpContext) {
        try {
            const subscription = await Subscription.findOrFail(params.id)
            const payload = await request.validateUsing(updateSubscriptionValidator)

            subscription.merge(payload)
            await subscription.save()

            return response.ok({
                status: 'success',
                message: 'Abonnement mis à jour avec succès',
                data: subscription,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la mise à jour de l’abonnement')
        }
    }

    /** 🔹 Supprime un abonnement */
    async delete({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.findOrFail(params.id)
            await subscription.delete()

            return response.ok({
                status: 'success',
                message: 'Abonnement supprimé avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression de l’abonnement')
        }
    }

    /** 🔹 Liste les paiements liés à un abonnement */
    async payments({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('id', params.id)
                .preload('payments')
                .firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Paiements récupérés avec succès',
                data: subscription.payments,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    /** 🔹 Abonnements expirant bientôt */
    async expiring({ request, response }: HttpContext) {
        try {
            const period = request.input('period', 'day') as Period
            const offset = Number(request.input('offset', 1))
            const page = request.input('page', 1)
            const limit = 10

            const { start, end } = getExpiryRange(period, offset)

            const subscriptions = await Subscription.query()
                .whereBetween('end_date', [start.toSQL()!, end.toSQL()!])
                .preload('student')
                .preload('room')
                .orderBy('end_date', 'asc')
                .paginate(page, limit)

            subscriptions.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: `Abonnements expirant dans ${offset} ${period}(s)`,
                data: subscriptions,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la récupération des abonnements expirants',
            )
        }
    }

    /** 🔹 Abonnements par statut */
    async byStatus({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const validStatuses = Object.values(SubscriptionStatus)
            if (!validStatuses.includes(status)) {
                return response.badRequest({
                    status: 'error',
                    message: `Statut invalide. Utilisez : ${validStatuses.join(', ')}`,
                })
            }
            const page = request.input('page', 1)
            const limit = 10

            const subscriptions = await Subscription.query()
                .where('status', status)
                .preload('student')
                .preload('room')
                .preload('payments')
                .orderBy('end_date', 'asc')
                .paginate(page, limit)

            subscriptions.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: `Abonnements avec le statut "${status}" récupérés avec succès`,
                data: subscriptions,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la récupération des abonnements par statut',
            )
        }
    }

    /** 🔹 Temps restant avant expiration */
    async remainingTime({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('id', params.id)
                .preload('student')
                .preload('room')
                .firstOrFail()

            const now = DateTime.now()
            const end = DateTime.fromJSDate(subscription.endDate as unknown as Date)

            const diffDays = Math.max(0, Math.floor(end.diff(now, 'days').days))
            const diffWeeks = Math.floor(diffDays / 7)
            const diffMonths = Math.max(0, Math.floor(end.diff(now, 'months').months))

            return response.ok({
                status: 'success',
                message: 'Temps restant calculé avec succès',
                data: {
                    subscriptionId: subscription.id,
                    student: subscription.student,
                    room: subscription.room,
                    remaining: { months: diffMonths, weeks: diffWeeks, days: diffDays },
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du calcul du temps restant')
        }
    }
}
