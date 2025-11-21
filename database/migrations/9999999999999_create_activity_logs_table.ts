import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activity_logs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('user_id').notNullable().index()
      table.string('role').notNullable()
      table.string('action').notNullable()
      table.string('entity_type').nullable()
      table.string('entity_id').nullable()
      table.jsonb('metadata').nullable()
      table.string('ip_address').nullable()
      table.string('user_agent').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}


