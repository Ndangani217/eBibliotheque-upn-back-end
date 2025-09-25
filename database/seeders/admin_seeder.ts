import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { Role } from '#types/role'

export default class extends BaseSeeder {
    public async run() {
        // Vérifier si un admin existe déjà
        const existingAdmin = await User.query().where('role', Role.ADMIN).first()

        if (!existingAdmin) {
            await User.createMany([
                {
                    email: 'ephraimmputu@gmail.com',
                    phoneNumber: '+243828969931',
                    password: 'Mputu@2025',
                    firstName: 'Ephraim',
                    name: 'Mputu',
                    role: Role.ADMIN,
                    isVerified: true,
                },
                {
                    email: 'nathanndangani1@gmail.com',
                    password: 'Nathan@2025',
                    firstName: 'Nathan',
                    name: 'Ndangani',
                    lastName: 'Nathan',
                    role: Role.MANAGER,
                    isVerified: true,
                },
            ])
        }
    }
}
