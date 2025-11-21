import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'user_sessions'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

            table.string('session_token', 255).notNullable().unique()
            table.string('ip_address', 100).nullable()
            table.string('device_info', 255).nullable()

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
