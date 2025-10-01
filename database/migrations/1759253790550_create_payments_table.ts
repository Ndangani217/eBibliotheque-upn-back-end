import { BaseSchema } from '@adonisjs/lucid/schema'
import { PaymentStatus } from '#types/paymentStatus'

export default class extends BaseSchema {
    protected tableName = 'payments'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')

            table
                .integer('subscription_id')
                .unsigned()
                .references('id')
                .inTable('subscriptions')
                .onDelete('CASCADE')

            table.decimal('amount', 10, 2).notNullable()
            table.string('reference').notNullable()
            table.timestamp('date', { useTz: true }).notNullable()

            table
                .enum('status', Object.values(PaymentStatus), {
                    useNative: true,
                    enumName: 'payment_status',
                })
                .notNullable()
                .defaultTo(PaymentStatus.EN_ATTENTE)

            table.timestamps(true, true)
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
        this.schema.raw('DROP TYPE IF EXISTS payment_status')
    }
}
