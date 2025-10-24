import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRefreshTokensTable extends BaseSchema {
    protected tableName = 'refresh_tokens' // ✅ cohérent avec ton modèle

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

            table.string('token', 255).notNullable().unique()
            table.boolean('is_revoked').defaultTo(false)
            table.timestamp('expires_at', { useTz: true }).notNullable()

            table.timestamp('created_at', { useTz: true })
            table.timestamp('updated_at', { useTz: true })
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
