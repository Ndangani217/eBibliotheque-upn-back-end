import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'
import Subscription from '#models/subscription'
import { PaymentStatus } from '#types/paymentStatus'

export default class Payment extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare reservationId: number

    @column()
    declare subscriptionId?: number | null

    @column()
    declare amount: number

    @column()
    declare reference: string

    @column({ columnName: 'proof_url' })
    declare proofUrl: string | null

    @column.dateTime()
    declare date: DateTime

    @column()
    declare status: PaymentStatus

    @belongsTo(() => Reservation)
    declare reservation: BelongsTo<typeof Reservation>

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
