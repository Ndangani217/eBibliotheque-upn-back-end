import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import { Role } from '#types/role'

export default class Faculty extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare code: string

    @column()
    declare name: string

    @hasMany(() => User, {
        foreignKey: 'facultyId',
        localKey: 'id',
        onQuery: (query) => query.where('role', Role.STUDENT),
    })
    declare students: HasMany<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
