import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Role } from '../types/role/index.js'
import Student from '#models/student'
import Admin from '#models/admin'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email'],
    passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare email: string

    @column()
    declare role: Role

    @column()
    declare isVerified: boolean

    @column({ serializeAs: null })
    declare password: string

    @hasOne(() => Student)
    declare student: HasOne<typeof Student>

    @hasOne(() => Admin)
    declare admin: HasOne<typeof Admin>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    static accessTokens = DbAccessTokensProvider.forModel(User)
}
