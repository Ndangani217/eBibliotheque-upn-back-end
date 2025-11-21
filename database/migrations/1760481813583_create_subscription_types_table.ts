import { BaseSchema } from '@adonisjs/lucid/schema'
import { SubscriberCategory } from '#enums/library_enums'

export default class CreateSubscriptionTypesTable extends BaseSchema {
    protected tableName = 'subscription_types'

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.enum('category', Object.values(SubscriberCategory)).notNullable()
            table.decimal('price', 12, 2).notNullable()
            table.integer('duration_months').notNullable()
            table.text('description').nullable()
            table.boolean('is_active').defaultTo(true)
            table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
            table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
        })
    }

    public async down() {
        this.schema.dropTable(this.tableName)
    }
}
