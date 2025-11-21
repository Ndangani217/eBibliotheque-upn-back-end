import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'subscription_cards'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

            table.string('unique_code').notNullable().unique()
            table.string('qr_code_path').notNullable()
            table.text('qr_code_base64').nullable()
            table.string('pdf_path').notNullable()
            table.timestamp('issued_at', { useTz: true }).notNullable()
            table.boolean('is_active').defaultTo(true)

            table
                .uuid('subscription_id')
                .references('id')
                .inTable('subscriptions')
                .onDelete('CASCADE')

            table.timestamp('expires_at', { useTz: true }).nullable()

            table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
            table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
