import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Student from '#models/user'
import Room from '#models/room'
import Payment from '#models/payment'

export default class Subscription extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare studentId: number

    @column()
    declare roomId: number

    @column.date()
    declare startDate: DateTime

    @column.date()
    declare endDate: DateTime

    @column()
    declare status: 'actif' | 'expiré' | 'suspendu'

    @column()
    declare reference: string

    @belongsTo(() => Student)
    declare student: BelongsTo<typeof Student>

    @belongsTo(() => Room)
    declare room: BelongsTo<typeof Room>

    @hasMany(() => Payment)
    declare payments: HasMany<typeof Payment>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
