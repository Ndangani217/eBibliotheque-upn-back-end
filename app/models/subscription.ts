import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { SubscriptionStatus } from '#enums/library_enums'
import type { BelongsTo, HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import SubscriptionCard from '#models/subscription_card'
import User from '#models/user'
import PaymentVoucher from '#models/payment_voucher'
import Notification from '#models/notification'

export default class Subscription extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column.dateTime()
    declare startDate: DateTime

    @column.dateTime()
    declare endDate: DateTime

    @column()
    declare status: SubscriptionStatus

    @belongsTo(() => PaymentVoucher)
    declare paymentVoucher: BelongsTo<typeof PaymentVoucher>

    @belongsTo(() => User)
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => User)
    declare validatedBy: BelongsTo<typeof User>

    @hasOne(() => SubscriptionCard)
    declare card: HasOne<typeof SubscriptionCard>

    @hasMany(() => Notification)
    declare notifications: HasMany<typeof Notification>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
