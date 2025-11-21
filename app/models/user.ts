// app/Models/User.ts
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { UserRole, SubscriberCategory } from '#enums/library_enums'
import Subscription from '#models/subscription'
import PaymentVoucher from '#models/payment_voucher'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email'],
    passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare name: string

    @column()
    declare lastName: string

    @column()
    declare firstName: string

    @column()
    declare email: string

    @column({ serializeAs: null })
    declare password: string

    @column()
    declare phoneNumber: string

    @column({ columnName: 'verify_token', serializeAs: null })
    declare verifyToken: string | null

    @column({ columnName: 'reset_token', serializeAs: null })
    declare resetToken: string | null

    @column.dateTime({ columnName: 'verify_expires', serializeAs: null })
    declare verifyExpires: DateTime | null

    @column.dateTime({ columnName: 'reset_expires', serializeAs: null })
    declare resetExpires: DateTime | null

    /**  Statuts du compte */
    @column({ columnName: 'is_verified', serializeAs: 'isVerified' })
    declare isVerified: boolean

    @column({ columnName: 'is_blocked', serializeAs: 'isBlocked' })
    declare isBlocked: boolean

    @column()
    declare role: UserRole

    @column()
    declare category: SubscriberCategory | null

    @column()
    declare matricule: string | null

    @hasMany(() => Subscription)
    declare subscriptions: HasMany<typeof Subscription>

    @column({ columnName: 'subscriber_id' })
    declare subscriberId: string

    @belongsTo(() => User, { foreignKey: 'subscriberId' })
    declare subscriber: BelongsTo<typeof User>

    @hasMany(() => PaymentVoucher)
    declare paymentVouchers: HasMany<typeof PaymentVoucher>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    /** Fournisseur de tokens d’accès JWT */
    static accessTokens = DbAccessTokensProvider.forModel(User, {
        expiresIn: '30 days',
        prefix: 'funda_',
        table: 'auth_access_tokens',
        type: 'auth_token',
        tokenSecretLength: 200,
    })
}
