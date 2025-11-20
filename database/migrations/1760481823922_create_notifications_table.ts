import { BaseSchema } from '@adonisjs/lucid/schema'
import { NotificationType, NotificationChannel } from '#enums/library_enums'

export default class extends BaseSchema {
    protected tableName = 'notifications'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.enum('type', Object.values(NotificationType)).notNullable()
            table.string('title').notNullable()
            table.text('message').notNullable()
            table.boolean('is_read').defaultTo(false)
            table.timestamp('sent_at', { useTz: true }).nullable()
            table.enum('channel', Object.values(NotificationChannel)).notNullable()

            table.uuid('subscriber_id').references('id').inTable('users').onDelete('CASCADE')

            table
                .uuid('subscription_id')
                .references('id')
                .inTable('subscriptions')
                .onDelete('CASCADE')

            table.uuid('sender_id').references('id').inTable('users').onDelete('SET NULL')

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
