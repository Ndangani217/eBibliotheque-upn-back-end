import SubscriptionType from '#models/subscription_type'
import { SubscriberCategory } from '#enums/library_enums'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class SubscriptionTypeSeeder extends BaseSeeder {
    async run() {
        await SubscriptionType.createMany([
            {
                category: SubscriberCategory.STUDENT,
                price: 5,
                durationMonths: 3,
                description: 'Abonnement étudiant 3 mois',
            },
            {
                category: SubscriberCategory.STUDENT,
                price: 10,
                durationMonths: 6,
                description: 'Abonnement étudiant 6 mois',
            },
            {
                category: SubscriberCategory.STUDENT,
                price: 15,
                durationMonths: 12,
                description: 'Abonnement étudiant 12 mois',
            },

            // Chercheur
            {
                category: SubscriberCategory.RESEARCHER,
                price: 10,
                durationMonths: 3,
                description: 'Abonnement chercheur 3 mois',
            },
            {
                category: SubscriberCategory.RESEARCHER,
                price: 15,
                durationMonths: 6,
                description: 'Abonnement chercheur 6 mois',
            },
            {
                category: SubscriberCategory.RESEARCHER,
                price: 20,
                durationMonths: 12,
                description: 'Abonnement chercheur 12 mois',
            },
        ])
    }
}
