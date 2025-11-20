import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne, belongsTo } from '@adonisjs/lucid/orm'
import { VoucherStatus } from '#enums/library_enums'
import type { HasMany, HasOne, BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'
import Subscription from '#models/subscription'
import SubscriptionType from '#models/subscription_type'
import User from '#models/user'

export default class PaymentVoucher extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare referenceCode: string

    @column()
    declare amount: number

    @column()
    declare status: VoucherStatus

    @column()
    declare bankReceiptNumber: string

    @column.dateTime()
    declare validatedAt: DateTime

    @belongsTo(() => User)
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => SubscriptionType)
    declare subscriptionType: BelongsTo<typeof SubscriptionType>

    @hasMany(() => Transaction)
    declare transactions: HasMany<typeof Transaction>

    @hasOne(() => Subscription)
    declare subscription: HasOne<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
