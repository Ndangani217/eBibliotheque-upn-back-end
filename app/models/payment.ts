import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'

export default class Payment extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare subscriptionId: number

    @column()
    declare amount: number

    @column()
    declare reference: string

    @column.dateTime()
    declare date: DateTime

    @column()
    declare status: 'validé' | 'en attente' | 'rejeté'

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
