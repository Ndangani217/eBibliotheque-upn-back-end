// database/seeders/RoomSeeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Room from '#models/room'

export default class RoomSeeder extends BaseSeeder {
    public async run() {
        const homes = [
            { name: 'Home 1', niveaux: 4 },
            { name: 'Home 2', niveaux: 3 },
        ]

        const rooms: any[] = []

        for (const home of homes) {
            for (let niveau = 0; niveau <= home.niveaux; niveau++) {
                const niveauLabel = niveau === 0 ? 'RDC' : `Niveau ${niveau}`

                for (let numero = 1; numero <= 10; numero++) {
                    rooms.push({
                        type: 'Standard',
                        capacity: 4,
                        availableSpots: 4,
                        location: `${home.name} - ${niveauLabel} - Ch ${numero}`,
                        occupancyStatus: 'Disponible',
                        isAvailable: true,
                        description: `Chambre ${numero} au ${niveauLabel} de ${home.name}`,
                    })
                }
            }
        }

        await Room.createMany(rooms)

        console.log(`${rooms.length} chambres insérées avec succès`)
    }
}
