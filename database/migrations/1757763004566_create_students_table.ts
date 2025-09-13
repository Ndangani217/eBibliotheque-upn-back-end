import { BaseSchema } from '@adonisjs/lucid/schema'
import { Promotion } from '../../app/types/promotion/index.js'
import { Sexe } from '../../app/types/sexe/index.js'

export default class extends BaseSchema {
    protected tableName = 'students'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')

            table
                .integer('user_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')

            table.string('first_name').notNullable()
            table.string('name').notNullable()
            table.string('last_name').notNullable()
            table.enum('gender', Object.values(Sexe)).notNullable()
            table.string('phone_number').notNullable()
            table
                .string('faculty_code')
                .notNullable()
                .references('code')
                .inTable('faculties')
                .onDelete('CASCADE')
            table.string('department').notNullable()
            table.enum('promotion', Object.values(Promotion)).notNullable()
            table.string('photo_url').nullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
