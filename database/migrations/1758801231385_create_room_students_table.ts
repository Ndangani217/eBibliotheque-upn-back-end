import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'room_students'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary()
            table
                .integer('room_id')
                .unsigned()
                .references('id')
                .inTable('rooms')
                .onDelete('CASCADE')
            table
                .integer('student_id')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')

            table.unique(['room_id', 'student_id'])
            table.timestamp('created_at', { useTz: true })
            table.timestamp('updated_at', { useTz: true })
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
