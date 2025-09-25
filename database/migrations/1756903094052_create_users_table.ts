import { BaseSchema } from '@adonisjs/lucid/schema'
import { Role } from '#types/role'
import { Promotion } from '#types/promotion'
import { Gender } from '#types/gender'
import Faculty from '#models/faculty'

export default class extends BaseSchema {
    protected tableName = 'users'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary()
            table.string('first_name').notNullable()
            table.string('name').notNullable()
            table.string('last_name').nullable()
            table.enum('gender', Object.values(Gender)).nullable()
            table.string('phone_number').unique()

            table.enum('faculty_code', Object.values(Faculty)).nullable()

            table.string('department').nullable()
            table.enum('promotion', Object.values(Promotion)).nullable()
            table.string('photo_url').nullable()
            table.string('email', 254).notNullable().unique()
            table.string('password').nullable()
            table.enum('role', Object.values(Role)).notNullable()
            table.boolean('is_verified').notNullable().defaultTo(false)

            table.timestamp('created_at', { useTz: true }).notNullable()
            table.timestamp('updated_at', { useTz: true }).nullable()

            table.string('verify_token').nullable()
            table.string('reset_token').nullable()
            table.timestamp('reset_expires', { useTz: true }).nullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
