import { BaseSchema } from '@adonisjs/lucid/schema'
import { Status } from '../../app/types/status/index.js'

export default class extends BaseSchema {
    protected tableName = 'rooms'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.string('id').primary()
            table.string('type').notNullable()
            table.integer('capacity').notNullable()
            table
                .enum('occupancy_status', Object.values(Status), {
                    useNative: true,
                    enumName: 'room_status_enum',
                })
                .notNullable()
            table.integer('available_spots').notNullable()
            table.string('location').notNullable()
            table.boolean('is_available').defaultTo(true)
            table.specificType('current_members', 'integer[]').defaultTo('{}')
            table.string('description', 500)

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
