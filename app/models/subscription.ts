import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import { SubscriptionStatus } from '#enums/library_enums'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import SubscriptionCard from '#models/subscription_card'
import User from '#models/user'
import PaymentVoucher from '#models/payment_voucher'

export default class Subscription extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column.dateTime()
    declare startDate: DateTime

    @column.dateTime()
    declare endDate: DateTime

    @column()
    declare status: SubscriptionStatus

    @column({ columnName: 'payment_voucher_id' })
    declare paymentVoucherId: number

    @column({ columnName: 'subscriber_id' })
    declare subscriberId: string

    @column({ columnName: 'validated_by' })
    declare validatedBy: string | null

    @belongsTo(() => PaymentVoucher)
    declare paymentVoucher: BelongsTo<typeof PaymentVoucher>

    @belongsTo(() => User, { foreignKey: 'subscriberId' })
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => User, { foreignKey: 'validatedBy' })
    declare validator: BelongsTo<typeof User>

    @hasOne(() => SubscriptionCard)
    declare card: HasOne<typeof SubscriptionCard>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
