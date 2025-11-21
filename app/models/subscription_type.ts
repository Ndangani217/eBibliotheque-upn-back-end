import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PaymentVoucher from '#models/payment_voucher'
import { SubscriberCategory } from '#enums/library_enums'

export default class SubscriptionType extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare category: SubscriberCategory

    @column()
    declare price: number

    @column({ columnName: 'duration_months' })
    declare durationMonths: number

    @column()
    declare description?: string | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @hasMany(() => PaymentVoucher)
    declare paymentVouchers: HasMany<typeof PaymentVoucher>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
