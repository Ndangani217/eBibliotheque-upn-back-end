import { BaseSchema } from '@adonisjs/lucid/schema'
import { Role } from '../../app/types/role/index.js'

export default class extends BaseSchema {
    protected tableName = 'users'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').notNullable()
            table.string('email', 254).notNullable().unique()
            table.string('password').nullable()
            table.enum('role', Object.values(Role)).notNullable()
            table.boolean('is_verified').notNullable().defaultTo(false)
            table.timestamp('created_at').notNullable()
            table.timestamp('updated_at').nullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
