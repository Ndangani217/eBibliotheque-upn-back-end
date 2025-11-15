import Subscription from '#models/subscription'
import { SubscriptionStatus } from '#enums/library_enums'
import { DateTime } from 'luxon'

/**
 * Vérifie si un abonné a un abonnement actif (non expiré)
 * @param subscriberId - ID de l'abonné
 * @returns L'abonnement actif ou null
 */
export async function getActiveSubscription(subscriberId: string) {
    return await Subscription.query()
        .where('subscriber_id', subscriberId)
        .where((q) => {
            q.where('status', SubscriptionStatus.VALIDE).andWhere('end_date', '>', DateTime.now().toSQL())
        })
        .first()
}

