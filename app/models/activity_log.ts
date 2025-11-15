import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ActivityLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: string

  @column()
  public role: string

  @column()
  public action: string

  @column()
  public entityType?: string | null

  @column()
  public entityId?: string | null

  @column()
  public metadata?: any

  @column()
  public ipAddress?: string | null

  @column()
  public userAgent?: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
}


