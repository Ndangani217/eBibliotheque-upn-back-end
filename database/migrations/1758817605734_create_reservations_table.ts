import { BaseSchema } from '@adonisjs/lucid/schema'
import { ReservationStatus } from '#types/reservationStatus'

export default class extends BaseSchema {
    protected tableName = 'reservations'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary()
            table
                .integer('student_id')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
            table
                .integer('room_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('rooms')
                .onDelete('SET NULL')
            table.string('preferred_type').nullable()
            table
                .enum('status', Object.values(ReservationStatus))
                .defaultTo(ReservationStatus.EN_ATTENTE)
            table.text('observation_manager').nullable()

            table.timestamp('approved_at').nullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
