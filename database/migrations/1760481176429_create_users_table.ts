import { BaseSchema } from '@adonisjs/lucid/schema'
import { UserRole, SubscriberCategory } from '#enums/library_enums'

export default class extends BaseSchema {
    protected tableName = 'users'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
            table.string('name', 100).notNullable()
            table.string('last_name', 100).notNullable()
            table.string('first_name', 100).notNullable()
            table.string('email', 254).notNullable().unique()
            table.string('password').notNullable()
            table.string('phone_number').unique().notNullable()
            table.enum('role', Object.values(UserRole)).notNullable()
            table.enum('category', Object.values(SubscriberCategory)).nullable()
            table.boolean('is_verified').notNullable().defaultTo(false)
            table.boolean('is_blocked').notNullable().defaultTo(false)
            table.string('matricule').nullable()
            table.timestamp('created_at').notNullable()
            table.timestamp('updated_at').nullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
