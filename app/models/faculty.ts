import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Student from '#models/student'

export default class Faculty extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare code: string

    @column()
    declare name: string

    @hasMany(() => Student, {
        foreignKey: 'facultyCode',
        localKey: 'code',
    })
    declare students: HasMany<typeof Student>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
