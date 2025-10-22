import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeDelete } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'
import fs from 'node:fs'

export default class SubscriptionCard extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare uniqueCode: string

    @column()
    declare qrCodePath: string

    @column()
    declare pdfPath: string

    @column.dateTime()
    declare issuedAt: DateTime

    @column()
    declare isActive: boolean

    @column({ columnName: 'subscription_id' })
    declare subscriptionId: string

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    /** Supprime automatiquement les fichiers QR/PDF lors de la suppression */
    @beforeDelete()
    static async deleteFiles(card: SubscriptionCard) {
        try {
            if (card.qrCodePath && fs.existsSync(card.qrCodePath)) {
                fs.unlinkSync(card.qrCodePath)
                console.log(`QR code supprimé : ${card.qrCodePath}`)
            }

            if (card.pdfPath && fs.existsSync(card.pdfPath)) {
                fs.unlinkSync(card.pdfPath)
                console.log(`PDF supprimé : ${card.pdfPath}`)
            }
        } catch (error) {
            console.error('Erreur lors de la suppression des fichiers de la carte :', error)
        }
    }
}
