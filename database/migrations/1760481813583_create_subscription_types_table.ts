import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'subscription_types'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.string('name', 100).notNullable().unique()
            table.decimal('price', 10, 2).notNullable()
            table.string('description').nullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
