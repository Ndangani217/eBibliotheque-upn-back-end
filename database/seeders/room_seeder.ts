// database/seeders/RoomSeeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Room from '#models/room'

export default class RoomSeeder extends BaseSeeder {
    public async run() {
        const batiments = [
            { name: 'A', niveaux: 4 },
            { name: 'B', niveaux: 3 },
        ]

        const rooms: any[] = []

        for (const batiment of batiments) {
            for (let niveau = 0; niveau <= batiment.niveaux; niveau++) {
                const niveauLabel = niveau === 0 ? 'RDC' : `Niveau ${niveau}`

                for (let numero = 1; numero <= 10; numero++) {
                    rooms.push({
                        type: 'M',
                        capacity: 4,
                        availableSpots: 4,
                        location: `Bâtiment ${batiment.name} - ${niveauLabel}`,
                        occupancyStatus: 'Disponible',
                        isAvailable: true,
                        description: `Chambre ${numero} - ${niveauLabel}, bâtiment ${batiment.name}`,
                    })
                }
            }
        }

        await Room.createMany(rooms)

        console.log(`${rooms.length} chambres insérées avec succès`)
    }
}
