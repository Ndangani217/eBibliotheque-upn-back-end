import { BaseSchema } from '@adonisjs/lucid/schema'
import { SubscriptionStatus } from '#enums/library_enums'

export default class extends BaseSchema {
    protected tableName = 'subscriptions'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

            table.timestamp('start_date', { useTz: true }).notNullable()
            table.timestamp('end_date', { useTz: true }).notNullable()
            table.enum('status', Object.values(SubscriptionStatus)).notNullable()

            table
                .integer('payment_voucher_id')
                .unsigned()
                .references('id')
                .inTable('payment_vouchers')
                .onDelete('CASCADE')

            table.uuid('subscriber_id').references('id').inTable('users').onDelete('CASCADE')

            table.uuid('validated_by_id').references('id').inTable('users').onDelete('SET NULL')

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
