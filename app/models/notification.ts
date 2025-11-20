import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { NotificationType, NotificationChannel } from '#enums/library_enums'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'
import User from '#models/user'

export default class Notification extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare type: NotificationType

    @column()
    declare title: string

    @column()
    declare message: string

    @column()
    declare isRead: boolean

    @column.dateTime()
    declare sentAt: DateTime

    @column()
    declare channel: NotificationChannel

    @belongsTo(() => User)
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @belongsTo(() => User)
    declare sender: BelongsTo<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
