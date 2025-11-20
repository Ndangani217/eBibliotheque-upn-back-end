import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'

export default class SubscriptionCard extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare qrCode: string

  @column()
  declare filePath: string

  @column.dateTime()
  declare issuedAt: DateTime

  @column()
  declare isActive: boolean

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
