import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Role } from '#types/role'
import Faculty from '#models/faculty'
import UserSession from '#models/user_session'
import { Promotion } from '#types/promotion'
import { Gender } from '#types/gender'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email'],
    passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'first_name', serializeAs: 'firstName' })
    declare firstName: string

    @column()
    declare name: string

    @column({ columnName: 'last_name', serializeAs: 'lastName' })
    declare lastName: string

    @column()
    declare gender: Gender

    @column({ columnName: 'phone_number', serializeAs: 'phoneNumber' })
    declare phoneNumber: string

    @column()
    declare faculty: string | null

    @belongsTo(() => Faculty, {
        foreignKey: 'faculty',
        localKey: 'code',
    })
    declare facultyCode: BelongsTo<typeof Faculty>

    @column()
    declare department: string

    @column()
    declare promotion: Promotion

    @column()
    declare email: string

    @column()
    declare role: Role

    @column({ serializeAs: null })
    declare password: string

    @column({ columnName: 'photo_url', serializeAs: 'photoUrl' })
    declare photoUrl: string

    @column({ columnName: 'is_verified', serializeAs: 'isVerified' })
    declare isVerified: boolean

    @column({ columnName: 'verify_token', serializeAs: null })
    declare verifyToken: string | null

    @column({ columnName: 'reset_token', serializeAs: null })
    declare resetToken: string | null

    @hasMany(() => UserSession)
    declare sessions: HasMany<typeof UserSession>

    @column.dateTime({ columnName: 'last_seen_at', serializeAs: 'lastSeenAt' })
    declare lastSeenAt: DateTime | null

    @column.dateTime({ columnName: 'reset_expires', serializeAs: null })
    declare resetExpires: DateTime | null

    @column.dateTime({ columnName: 'created_at', autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    static accessTokens = DbAccessTokensProvider.forModel(User, {
        expiresIn: '30 days',
        prefix: 'oat_',
        table: 'auth_access_tokens',
        type: 'auth_token',
        tokenSecretLength: 160,
    })
}
