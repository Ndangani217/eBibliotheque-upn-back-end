import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Admin from '#models/admin'
import { Role } from '../../app/types/role/index.js'

export default class extends BaseSeeder {
    async run() {
        const existingAdmin = await User.query().where('role', Role.ADMIN).first()
        if (!existingAdmin) {
            const user = await User.create({
                email: 'ephraimmputu@gmail.com',
                password: 'Mputu@2025',
                role: Role.ADMIN,
                isVerified: true,
            })

            await Admin.create({
                userId: user.id,
                firstName: 'Ephraim',
                name: 'Mputu',
            })
        }
    }
}
