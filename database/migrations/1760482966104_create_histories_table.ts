import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'action_histories'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')

            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

            table.string('action_type', 100).notNullable()
            table.text('description').notNullable()
            table.string('ip_address', 45).nullable()
            table.string('user_agent').nullable()
            table.timestamp('performed_at', { useTz: true }).defaultTo(this.now())

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
