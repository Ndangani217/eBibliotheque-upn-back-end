import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Room from '#models/room'
import { ReservationStatus } from '#types/reservationStatus'

export default class Reservation extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare studentId: number

    @belongsTo(() => User, {
        foreignKey: 'studentId',
    })
    declare student: BelongsTo<typeof User>

    @column()
    declare roomId: number | null

    @belongsTo(() => Room, {
        foreignKey: 'roomId',
    })
    declare room: BelongsTo<typeof Room>

    @column()
    declare preferredType: string | null

    @column()
    declare status: ReservationStatus

    @column()
    declare observationManager: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
