import cron from 'node-cron'
import { DateTime } from 'luxon'
import Subscription from '#models/subscription'
import SubscriptionCard from '#models/subscription_card'
import { SubscriptionStatus } from '#enums/library_enums'

/**
 * CRON — Exécution chaque jour à 00:00
 * Met à jour :
 * Les abonnements expirés
 * Les cartes liées à ces abonnements
 */
cron.schedule('0 0 * * *', async () => {
    const now = DateTime.now()

    console.log(`\n[CRON] Vérification quotidienne des abonnements et cartes (${now.toISODate()})`)

    try {
        // --- TRAITEMENT DES ABONNEMENTS EXPIRÉS ---
        const expiredSubscriptions = await Subscription.query()
            .where('end_date', '<', now.toISO())
            .whereNot('status', SubscriptionStatus.EXPIRE)
            .preload('subscriber')
            .preload('card')

        if (expiredSubscriptions.length === 0) {
            console.log('[CRON] Aucun abonnement expiré trouvé.')
        } else {
            for (const sub of expiredSubscriptions) {
                sub.status = SubscriptionStatus.EXPIRE
                await sub.save()
                console.log(
                    `[CRON] Abonnement ${sub.id} (${sub.subscriber?.firstName ?? ''} ${sub.subscriber?.lastName ?? ''}) marqué comme expiré.`,
                )

                // Désactiver la carte associée (si active)
                if (sub.card && sub.card.isActive) {
                    sub.card.isActive = false
                    await sub.card.save()
                    console.log(
                        `   Carte ${sub.card.uniqueCode} désactivée (expiration de l’abonnement).`,
                    )
                }
            }
        }

        // --- TRAITEMENT DES CARTES EXPIRÉES ---
        const expiredCards = await SubscriptionCard.query()
            .where('is_active', true)
            .where('expires_at', '<', now.toISO())

        if (expiredCards.length > 0) {
            for (const card of expiredCards) {
                card.isActive = false
                await card.save()
                console.log(
                    `[CRON] Carte ${card.uniqueCode} désactivée (expire le ${card.expiresAt?.toFormat('dd/MM/yyyy')}).`,
                )
            }
        } else {
            console.log('[CRON] Aucune carte expirée trouvée.')
        }

        console.log(`[CRON] Tâche terminée avec succès à ${DateTime.now().toFormat('HH:mm:ss')}\n`)
    } catch (error) {
        console.error('[CRON] Erreur lors du traitement des abonnements/cartes expirés :', error)
    }
})
