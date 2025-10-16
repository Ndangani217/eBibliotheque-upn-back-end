// database/migrations/xxxx_create_users_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'
import { UserRole, SubscriberCategory } from '#enums/library_enums'

export default class CreateUsersTable extends BaseSchema {
    protected tableName = 'users'

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

            table.string('first_name', 100).notNullable()
            table.string('last_name', 100).notNullable()
            table.string('email', 254).notNullable().unique()
            table.string('password').nullable()
            table.string('phone_number', 20).notNullable().unique()

            table.string('verify_token', 255).nullable()
            table.timestamp('verify_expires').nullable()
            table.string('reset_token', 255).nullable()
            table.timestamp('reset_expires').nullable()

            table.boolean('is_verified').notNullable().defaultTo(false)
            table.boolean('is_blocked').notNullable().defaultTo(false)

            table
                .enum('role', Object.values(UserRole), {
                    useNative: true,
                    enumName: 'user_role_enum',
                })
                .notNullable()

            table
                .enum('category', Object.values(SubscriberCategory), {
                    useNative: true,
                    enumName: 'subscriber_category_enum',
                })
                .nullable()

            table.string('matricule', 50).nullable()

            table.timestamps(true, true)
        })
    }

    public async down() {
        this.schema.dropTable(this.tableName)
        this.schema.raw('DROP TYPE IF EXISTS user_role_enum')
        this.schema.raw('DROP TYPE IF EXISTS subscriber_category_enum')
    }
}
