import { DateTime } from 'luxon'
import {
    BaseModel,
    column,
    belongsTo,
    hasMany,
    hasOne,
    beforeDelete,
    beforeSave,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import fs from 'node:fs'
import Transaction from '#models/transaction'
import Subscription from '#models/subscription'
import SubscriptionType from '#models/subscription_type'
import User from '#models/user'
import { VoucherStatus, SubscriberCategory, SubscriptionDuration } from '#enums/library_enums'

export default class PaymentVoucher extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare referenceCode: string

    @column()
    declare amount: number

    @column()
    declare category: SubscriberCategory

    @column()
    declare duration: SubscriptionDuration

    @column()
    declare status: VoucherStatus

    @column()
    declare qrCode: string | null

    @column()
    declare bankReceiptNumber: string | null

    @column()
    declare subscriberId: string

    @column.dateTime()
    declare validatedAt: DateTime | null

    @belongsTo(() => User, { foreignKey: 'subscriberId' })
    declare subscriber: BelongsTo<typeof User>

    @belongsTo(() => SubscriptionType, { foreignKey: 'subscriptionTypeId' })
    declare subscriptionType: BelongsTo<typeof SubscriptionType>

    @hasMany(() => Transaction)
    declare transactions: HasMany<typeof Transaction>

    @hasOne(() => Subscription)
    declare subscription: HasOne<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    /** Supprime le QR code associé lors de la suppression du bon */
    @beforeDelete()
    static async deleteQrFile(voucher: PaymentVoucher) {
        if (voucher.qrCode && fs.existsSync(voucher.qrCode)) {
            try {
                fs.unlinkSync(voucher.qrCode)
                console.log(`QR code supprimé : ${voucher.qrCode}`)
            } catch (error) {
                console.error('Erreur lors de la suppression du QR code :', error)
            }
        }
    }

    /** Vérifie automatiquement l’expiration du bon */
    @beforeSave()
    static async checkExpiration(voucher: PaymentVoucher) {
        const expirationDate = voucher.createdAt.plus({ months: voucher.duration })
        const now = DateTime.now()

        if (now > expirationDate && voucher.status !== VoucherStatus.EXPIRE) {
            voucher.status = VoucherStatus.EXPIRE
            console.log(`Bon ${voucher.referenceCode} marqué comme expiré.`)
        }
    }
}
