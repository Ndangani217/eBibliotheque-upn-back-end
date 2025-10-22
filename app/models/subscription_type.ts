import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PaymentVoucher from '#models/payment_voucher'
import { SubscriptionDuration } from '#enums/library_enums'

export default class SubscriptionType extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare category: string

    @column({ columnName: 'duration_months' })
    declare durationMonths: SubscriptionDuration

    @column()
    declare price: number

    @column()
    declare devise: string

    @column()
    declare description?: string | null

    @hasMany(() => PaymentVoucher)
    declare paymentVouchers: HasMany<typeof PaymentVoucher>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
