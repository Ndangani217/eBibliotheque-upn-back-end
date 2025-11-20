import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'transactions'

    async up() {
        const exists = await this.schema.hasTable(this.tableName)

        if (!exists) {
            this.schema.createTable(this.tableName, (table) => {
                table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
                table.string('bank_reference').notNullable()
                table.string('bank_status').notNullable()
                table.timestamp('transaction_date', { useTz: true }).notNullable()

                table
                    .integer('payment_voucher_id')
                    .unsigned()
                    .references('id')
                    .inTable('payment_vouchers')
                    .onDelete('CASCADE')

                table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
                table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
            })
        }
    }

    async down() {
        const exists = await this.schema.hasTable(this.tableName)
        if (exists) {
            this.schema.dropTable(this.tableName)
        }
    }
}
