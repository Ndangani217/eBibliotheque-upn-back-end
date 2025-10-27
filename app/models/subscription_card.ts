import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import Subscription from '#models/subscription'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { CardStatus } from '#enums/library_enums'

export default class SubscriptionCard extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare subscriptionId: string

    @column()
    declare uniqueCode: string

    @column()
    declare qrCodePath: string

    @column()
    declare pdfPath: string

    @column({ columnName: 'qr_code_base64' })
    declare qrCodeBase64: string | null

    @column()
    declare isActive: boolean

    @column.dateTime()
    declare issuedAt: DateTime

    @column.dateTime()
    declare expiresAt: DateTime

    @belongsTo(() => Subscription)
    declare subscription: BelongsTo<typeof Subscription>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    /**
     * Détermine automatiquement la date d’expiration avant création
     * - Si `Subscription` existe → copie directement `endDate`
     * - Sinon → fallback = `issuedAt + 12 mois`
     */
    @beforeCreate()
    static async setExpiration(card: SubscriptionCard) {
        const subscription = await Subscription.query().where('id', card.subscriptionId).first()

        // Sécurité : assure toujours une date d’émission
        if (!card.issuedAt) {
            card.issuedAt = DateTime.now()
        }

        if (subscription) {
            card.expiresAt = subscription.endDate
        } else {
            card.expiresAt = card.issuedAt.plus({ months: 12 })
        }
    }
}
