import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'
import { PaymentStatus } from '#types/paymentStatus'

export default class Payment extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare subscriptionId: number

    @column()
    declare amount: number

    @column({ columnName: 'proof_url' })
    declare proofUrl: string | null

    @column()
    declare reference: string

    @column.dateTime()
    declare date: DateTime

    @column()
    declare status: PaymentStatus

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @hasOne(() => Subscription, { foreignKey: 'paymentId' })
    declare principalSubscription: HasOne<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
