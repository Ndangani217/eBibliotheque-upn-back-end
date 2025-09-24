import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Faculty from '#models/faculty'
import { Promotion } from '../types/promotion/index.js'
import { Sexe } from '../types/sexe/index.js'

export default class Student extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: number

    @column()
    declare firstName: string

    @column()
    declare name: string

    @column()
    declare lastName: string

    @column()
    declare gender: Sexe

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

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
