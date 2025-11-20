import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'access_refresh_tokens'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')

            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

            table.string('token', 255).notNullable().unique()
            table.boolean('is_revoked').defaultTo(false)
            table.timestamp('expires_at', { useTz: true }).notNullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
