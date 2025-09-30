import { BaseSchema } from '@adonisjs/lucid/schema'

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
                .enu('status', ['validé', 'en attente', 'rejeté'], {
                    useNative: true,
                    enumName: 'payment_status',
                })
                .notNullable()
                .defaultTo('en attente')

            table.timestamps(true)

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
        this.schema.raw('DROP TYPE IF EXISTS payment_status')
    }
}
