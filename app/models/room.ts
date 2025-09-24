import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { Status } from '#types/status'

export default class Room extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare type: string
    @column()
    declare capacity: number

    @column()
    declare occupancyStatus: Status

    @column()
    declare availableSpots: number

    @column()
    declare location: string

    @column()
    declare isAvailable: boolean

    @column()
    declare currentMembers: number[]

    @column()
    declare description: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
