import { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { createSubscriptionValidator, updateSubscriptionValidator } from '#validators/subscription'
import { HandleError as handleError } from '#helpers/handleError'
import { DateTime } from 'luxon'
import { getExpiryRange } from '#helpers/dateRange'
import type { Period } from '#types/period'

export default class SubscriptionsController {
    // Récupérer tous les abonnements avec leurs relations (student, room, payments)
    async getAllSubscriptions({ response }: HttpContext) {
        try {
            const subscriptions = await Subscription.query()
                .preload('student')
                .preload('room')
                .preload('payments')
            return response.ok({
                status: 'success',
                message: 'Abonnements récupérés avec succès',
                data: subscriptions,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des abonnements')
        }
    }

    // Récupérer les détails d’un abonnement spécifique par ID
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

    // Créer un nouvel abonnement (valide les données puis insère en DB)
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

    //  Mettre à jour un abonnement existant
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

    // Supprimer un abonnement existant par ID
    async delete({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.findOrFail(params.id)
            await subscription.delete()

            return response.ok({
                status: 'success',
                message: 'Abonnement supprimé avec succès',
                data: null,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression de l’abonnement')
        }
    }

    // Récupérer tous les paiements liés à un abonnement donné
    async payments({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('id', params.id)
                .preload('payments')
                .firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Paiements liés à l’abonnement récupérés avec succès',
                data: subscription.payments,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    // Récupérer les abonnements expirant dans un délai défini (jour/semaine/mois/année)
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
                message: `Abonnements expirant dans ${offset} ${period}(s) récupérés avec succès`,
                data: {
                    period,
                    offset,
                    range: { start: start.toISO(), end: end.toISO() },
                    subscriptions,
                },
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la récupération des abonnements expirants',
            )
        }
    }

    // Récupérer les abonnements selon leur statut (actif, expiré, suspendu)
    async byStatus({ request, response }: HttpContext) {
        try {
            const status = request.input('status') // ?status=actif

            if (!['actif', 'expiré', 'suspendu'].includes(status)) {
                return response.badRequest({
                    status: 'error',
                    message: 'Statut invalide. Utilisez: actif, expiré ou suspendu',
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

    // Calculer le temps restant d’un abonnement (jours, semaines, mois)
    async remainingTime({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('id', params.id)
                .preload('student')
                .preload('room')
                .firstOrFail()

            const now = DateTime.now()
            const end = DateTime.fromJSDate(subscription.endDate as unknown as Date)

            if (end < now) {
                return response.ok({
                    status: 'success',
                    message: `L’abonnement ${subscription.reference} est déjà expiré`,
                    data: {
                        subscriptionId: subscription.id,
                        remaining: { months: 0, weeks: 0, days: 0 },
                    },
                })
            }

            const diffDays = Math.floor(end.diff(now, 'days').days || 0)
            const diffWeeks = Math.floor(diffDays / 7)
            const diffMonths = Math.floor(end.diff(now, 'months').months || 0)

            return response.ok({
                status: 'success',
                message: `Temps restant pour l’abonnement ${subscription.reference}`,
                data: {
                    subscriptionId: subscription.id,
                    student: subscription.student,
                    room: subscription.room,
                    endDate: subscription.endDate,
                    remaining: { months: diffMonths, weeks: diffWeeks, days: diffDays },
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du calcul du temps restant')
        }
    }
}
