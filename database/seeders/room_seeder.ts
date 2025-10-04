import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Room from '#models/room'
import { Status } from '#types/roomStatus'

export default class RoomSeeder extends BaseSeeder {
    public async run() {
        const homes = [
            { name: 'Home 1', niveaux: 4 },
            { name: 'Home 2', niveaux: 3 },
        ]

        const payload = []

        for (const home of homes) {
            for (let niveau = 0; niveau <= home.niveaux; niveau++) {
                const niveauLabel = niveau === 0 ? 'RDC' : `Niveau ${niveau}`

                for (let numero = 1; numero <= 10; numero++) {
                    const location = `${home.name} - ${niveauLabel} - Ch ${numero}`

                    payload.push({
                        type: 'Masculin',
                        capacity: 4,
                        availableSpots: 4,
                        location,
                        occupancyStatus: Status.DISPONIBLE,
                        isAvailable: true,
                        description: `Chambre ${numero} au ${niveauLabel} de ${home.name}`,
                    })
                }
            }
        }

        await Room.updateOrCreateMany('location', payload)

        console.log(`${payload.length} chambres synchronisées avec succès`)
    }
}
