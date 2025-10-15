import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class RefreshToken extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: string

    @column()
    declare token: string

    @column()
    declare isRevoked: boolean

    @column.dateTime()
    declare expiresAt: DateTime

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>
}
