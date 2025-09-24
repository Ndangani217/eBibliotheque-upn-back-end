import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Role } from '#types/role'
import Faculty from '#models/faculty'
import { Promotion } from '#types/promotion'
import { Gender } from '#types/gender'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email'],
    passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare firstName: string

    @column()
    declare name: string

    @column()
    declare lastName: string

    @column()
    declare gender: Gender

    @column()
    declare phoneNumber: string

    @column()
    declare facultyCode: string

    @belongsTo(() => Faculty, {
        foreignKey: 'facultyCode',
        localKey: 'code',
    })
    declare faculty: BelongsTo<typeof Faculty>

    @column()
    declare department: string

    @column()
    declare promotion: Promotion

    @column()
    declare photoUrl: string

    @column()
    declare email: string

    @column()
    declare role: Role

    @column()
    declare isVerified: boolean

    @column({ serializeAs: null })
    declare password: string

    @column({ serializeAs: null })
    declare verifyToken: string | null

    @column({ serializeAs: null })
    declare resetToken: string | null

    @column.dateTime({ serializeAs: null })
    declare resetExpires: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    static accessTokens = DbAccessTokensProvider.forModel(User, {
        expiresIn: '30 days',
        prefix: 'oat_',
        table: 'auth_access_tokens',
        type: 'auth_token',
        tokenSecretLength: 160,
    })
}
