import { BaseSchema } from '@adonisjs/lucid/schema'
import { SubscriptionStatus } from '#types/subscriptionStatus'

export default class extends BaseSchema {
    protected tableName = 'subscriptions'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table
                .integer('student_id')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
            table
                .integer('room_id')
                .unsigned()
                .references('id')
                .inTable('rooms')
                .onDelete('CASCADE')
            table.date('start_date').notNullable()
            table.date('end_date').notNullable()
            table
                .enum('status', Object.values(SubscriptionStatus))
                .notNullable()
                .defaultTo(SubscriptionStatus.ACTIF)
            table.string('reference').unique().notNullable()
            table.timestamps(true, true)
        })
    }
    async down() {
        this.schema.dropTable(this.tableName)
        this.schema.raw('DROP TYPE IF EXISTS subscription_status')
    }
}
