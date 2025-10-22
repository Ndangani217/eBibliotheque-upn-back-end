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

    /** ✅ Clé étrangère vers le bon de paiement */
    @column({ columnName: 'payment_voucher_id' })
    declare paymentVoucherId: number

    /** ✅ Clé étrangère vers l’abonné */
    @column({ columnName: 'subscriber_id' })
    declare subscriberId: string

    /** ✅ Clé étrangère vers le validateur (administrateur, manager, etc.) */
    @column({ columnName: 'validated_by' })
    declare validatedBy: string | null

    /** ✅ Relations */
    @belongsTo(() => PaymentVoucher)
    declare paymentVoucher: BelongsTo<typeof PaymentVoucher>

    @belongsTo(() => User, { foreignKey: 'subscriberId' })
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => User, { foreignKey: 'validatedBy' })
    declare validator: BelongsTo<typeof User>

    @hasOne(() => SubscriptionCard)
    declare card: HasOne<typeof SubscriptionCard>

    @hasMany(() => Notification)
    declare notifications: HasMany<typeof Notification>

    /** ✅ Dates automatiques */
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
