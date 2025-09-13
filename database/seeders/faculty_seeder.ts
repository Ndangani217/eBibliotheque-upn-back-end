import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Faculty from '#models/faculty'

export default class extends BaseSeeder {
    async run() {
        // Write your database queries inside the run method
        await Faculty.createMany([
            { code: 'SSAP', name: 'Sciences Sociales, Administratives et Politiques' },
            { code: 'SEG', name: 'Sciences Économiques et de Gestion' },
            { code: 'SAE', name: 'Sciences Agronomiques et Environnement' },
            { code: 'PDD', name: 'Pédagogie et Didactique des Disciplines' },
            { code: 'LSH', name: 'Lettres et Sciences Humaines' },
            { code: 'ST', name: 'Sciences et Technologie' },
            { code: 'DROIT', name: 'Droit (Sciences Juridiques)' },
            { code: 'SS', name: 'Sciences de la Santé' },
            { code: 'MV', name: 'Médecine Vétérinaire' },
            { code: 'PSE', name: 'Psychologie et Sciences de l’Éducation' },
            { code: 'ETT', name: 'École de Télécommunication et Téléinformatique' },
        ])
    }
}
