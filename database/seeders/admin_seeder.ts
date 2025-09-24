import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { Role } from '#types/role'

export default class extends BaseSeeder {
    async run() {
        const existingAdmin = await User.query().where('role', Role.ADMIN).first()
        if (!existingAdmin) {
            await User.create({
                email: 'ephraimmputu@gmail.com',
                phoneNumber: '+243828969931',
                password: 'Mputu@2025',
                firstName: 'Ephraim',
                name: 'Mputu',
                role: Role.ADMIN,
                isVerified: true,
            })
        }
    }
}
