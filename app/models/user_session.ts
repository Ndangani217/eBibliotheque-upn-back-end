import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class UserSession extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'user_id' })
    declare userId: number

    @column.dateTime({ columnName: 'login_at' })
    declare loginAt: DateTime

    @column.dateTime({ columnName: 'logout_at' })
    declare logoutAt: DateTime | null

    @column()
    declare ip?: string | null

    @column({ columnName: 'manager' })
    declare userAgent?: string | null

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
