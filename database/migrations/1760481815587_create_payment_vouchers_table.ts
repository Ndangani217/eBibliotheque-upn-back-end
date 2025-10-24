import { BaseSchema } from '@adonisjs/lucid/schema'
import { VoucherStatus } from '#enums/library_enums'

export default class CreatePaymentVouchersTable extends BaseSchema {
    protected tableName = 'payment_vouchers'

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.string('reference_code', 100).notNullable().unique()
            table.decimal('amount', 12, 2).notNullable()
            table
                .enum('status', Object.values(VoucherStatus))
                .notNullable()
                .defaultTo(VoucherStatus.EN_ATTENTE)

            table.string('bank_receipt_number').nullable()
            table.timestamp('validated_at', { useTz: true }).nullable()
            table.uuid('subscriber_id').references('id').inTable('users').onDelete('CASCADE')
            table
                .integer('subscription_type_id')
                .unsigned()
                .references('id')
                .inTable('subscription_types')
                .onDelete('CASCADE')

            table.string('qr_code').nullable()

            table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
            table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
        })
    }

    public async down() {
        this.schema.dropTable(this.tableName)
    }
}
