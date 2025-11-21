import cron from 'node-cron'
import SubscriptionCard from '#models/subscription_card'
import { DateTime } from 'luxon'

/**
 * Tâche CRON quotidienne (00h00)
 * Vérifie toutes les cartes d’abonnement expirées
 * et les désactive automatiquement.
 */
cron.schedule('0 0 * * *', async () => {
    try {
        const now = DateTime.now().toISODate()

        const cards = await SubscriptionCard.query()
            .where('is_active', true)
            .where('expires_at', '<', now)

        if (cards.length === 0) {
            console.log(`[CRON] Aucune carte expirée trouvée (${now})`)
            return
        }

        for (const card of cards) {
            card.isActive = false
            await card.save()
            console.log(
                `[CRON] Carte ${card.uniqueCode} désactivée (expirée le ${card.expiresAt?.toFormat('dd/MM/yyyy')})`,
            )
        }

        console.log(`[CRON] 🪪 ${cards.length} carte(s) désactivée(s) automatiquement le ${now}`)
    } catch (error) {
        console.error('[CRON] Erreur lors de la vérification des cartes expirées :', error)
    }
})
