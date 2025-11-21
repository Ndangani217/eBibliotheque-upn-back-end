import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PaymentVoucher from '#models/payment_voucher'

export default class Transaction extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare bankReference: string

    @column()
    declare bankStatus: string

    @column({ columnName: 'payment_voucher_id' })
    declare paymentVoucherId: number

    @column.dateTime()
    declare transactionDate: DateTime

    @belongsTo(() => PaymentVoucher, { foreignKey: 'paymentVoucherId' })
    declare paymentVoucher: BelongsTo<typeof PaymentVoucher>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
