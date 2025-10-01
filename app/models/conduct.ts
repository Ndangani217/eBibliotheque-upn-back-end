import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import { ConductStatus, ConductType } from '#types/conduct'

export default class Conduct extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare studentId: number

    @column()
    declare responsableId: number

    @column()
    declare type: ConductType

    @column()
    declare status: ConductStatus

    @column()
    declare description: string

    @column()
    declare attachment?: string | null

    @column.dateTime()
    declare date: DateTime

    @belongsTo(() => User, {
        foreignKey: 'studentId',
    })
    declare student: BelongsTo<typeof User>

    @belongsTo(() => User, {
        foreignKey: 'responsableId',
    })
    declare responsable: BelongsTo<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
