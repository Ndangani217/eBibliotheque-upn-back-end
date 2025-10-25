import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Subscription from '#models/subscription'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SubscriptionCard extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare subscriptionId: string

    @column()
    declare uniqueCode: string

    @column()
    declare qrCodePath: string

    @column()
    declare pdfPath: string

    @column({ columnName: 'qr_code_base64' })
    declare qrCodeBase64: string | null

    @column()
    declare isActive: boolean

    @column.dateTime()
    declare issuedAt: DateTime

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
