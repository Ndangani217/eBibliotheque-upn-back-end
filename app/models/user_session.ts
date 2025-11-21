// app/models/user_session.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class UserSession extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column({ columnName: 'user_id' })
    declare userId: string

    @column({ columnName: 'session_token' })
    declare sessionToken: string | null

    @column({ columnName: 'ip_address' })
    declare ipAddress: string | null

    @column({ columnName: 'device_info' })
    declare deviceInfo: string | null

    @column.dateTime({ columnName: 'logged_in_at' })
    declare loggedInAt: DateTime

    @column.dateTime({ columnName: 'logged_out_at' })
    declare loggedOutAt: DateTime | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
