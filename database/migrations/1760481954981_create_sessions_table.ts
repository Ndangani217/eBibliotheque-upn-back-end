import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'sessions'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
            table.string('session_token').unique().nullable()
            table.string('ip_address', 45).nullable()
            table.string('device_info').nullable()

            table.timestamp('logged_in_at', { useTz: true }).notNullable()
            table.timestamp('logged_out_at', { useTz: true }).nullable()
            table.boolean('is_active').defaultTo(true)

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
