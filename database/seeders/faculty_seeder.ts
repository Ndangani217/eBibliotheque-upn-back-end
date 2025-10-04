// database/seeders/FacultySeeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Faculty from '#models/faculty'
import { faculties } from '#constants/faculties'

export default class FacultySeeder extends BaseSeeder {
    public async run() {
        const payload = faculties.map((f) => ({ code: f.code, name: f.name }))
        await Faculty.updateOrCreateMany('code', payload)
        console.log(`Facultés synchronisées: ${payload.length}`)
    }
}
