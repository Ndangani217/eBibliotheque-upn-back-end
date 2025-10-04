import { BaseSchema } from '@adonisjs/lucid/schema'
import { Status } from '#types/roomStatus'

export default class extends BaseSchema {
    protected tableName = 'rooms'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary().notNullable()
            table.string('type').notNullable()
            table.string('location').nullable()
            table.integer('capacity').notNullable().defaultTo(4) // capacité fixe
            table.integer('available_spots').notNullable().defaultTo(4) // dispo initiale
            table
                .enum('occupancy_status', Object.values(Status))
                .notNullable()
                .defaultTo(Status.DISPONIBLE)
            table.boolean('is_available').notNullable().defaultTo(true)
            table.string('description', 255).nullable()
            table.timestamp('created_at', { useTz: true })
            table.timestamp('updated_at', { useTz: true })
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
