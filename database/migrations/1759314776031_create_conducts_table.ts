import { BaseSchema } from '@adonisjs/lucid/schema'
import { ConductType, ConductStatus } from '#types/conduct'

export default class extends BaseSchema {
    protected tableName = 'conducts'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table
                .integer('student_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
            table
                .integer('responsable_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
            table
                .enum('type', Object.values(ConductType), {
                    useNative: true,
                    enumName: 'conduct_type',
                })
                .notNullable()
            table
                .enum('status', Object.values(ConductStatus), {
                    useNative: true,
                    enumName: 'conduct_status',
                })
                .notNullable()
            table.text('description').notNullable()
            table.string('attachment').nullable()
            table.timestamp('date', { useTz: true }).notNullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
