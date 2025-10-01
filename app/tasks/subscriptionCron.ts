import cron from 'node-cron'
import Subscription from '#models/subscription'
import { SubscriptionStatus } from '#types/subscriptionStatus'
import { DateTime } from 'luxon'

cron.schedule('0 0 * * *', async () => {
    const now = DateTime.now().toISODate()

    const subscriptions = await Subscription.query()
        .where('end_date', '<', now)
        .whereNot('status', SubscriptionStatus.EXPIRE)

    for (const sub of subscriptions) {
        sub.status = SubscriptionStatus.EXPIRE
        await sub.save()
        console.log(`[CRON] Abonnement ${sub.reference} marqué comme expiré`)
    }
})
