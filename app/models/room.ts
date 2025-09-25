import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
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
    declare description: string

    @manyToMany(() => User, {
        pivotTable: 'room_students',
        pivotForeignKey: 'room_id',
        pivotRelatedForeignKey: 'student_id',
    })
    declare students: ManyToMany<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
