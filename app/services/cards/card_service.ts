/**
 * Service de gestion des cartes d'abonnement
 */
import SubscriptionCard from '#models/subscription_card'
import Subscription from '#models/subscription'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import path from 'node:path'
import fs from 'node:fs'
import { generateSubscriptionCardPDF } from '#services/pdf/subscription_card_pdf'

export interface GenerateCardResult {
    card: SubscriptionCard
    pdfPath: string
    qrPath: string
}

export class CardService {
    /**
     * Génère une carte d'abonnement
     */
    static async generateCard(subscriptionId: string): Promise<GenerateCardResult> {
        const subscription = await Subscription.query()
            .where('id', subscriptionId)
            .preload('subscriber')
            .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
            .firstOrFail()

        // Vérifie la validité de l'abonnement
        const now = DateTime.now()
        if (now > subscription.endDate) {
            throw new Error("L'abonnement est expiré, carte non disponible.")
        }

        // Vérifie s'il existe déjà une carte active
        const existingCard = await SubscriptionCard.query()
            .where('subscription_id', subscription.id)
            .where('is_active', true)
            .first()

        const uniqueCode = existingCard?.uniqueCode || `CARD-${randomUUID()}`
        const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`

        // Création du dossier temporaire
        const tmpDir = path.resolve(`tmp/cards/${uniqueCode}`)
        fs.mkdirSync(tmpDir, { recursive: true })

        const qrPath = path.join(tmpDir, `qrcode_${uniqueCode}.png`)
        const pdfPath = path.join(tmpDir, `card_${uniqueCode}.pdf`)

        await QRCode.toFile(qrPath, verifyUrl, { width: 250 })

        const { subscriber, paymentVoucher } = subscription
        const type = paymentVoucher.subscriptionType

        // Génération du PDF de la carte
        await generateSubscriptionCardPDF({
            outputPath: pdfPath,
            data: {
                fullName: `${subscriber.firstName} ${subscriber.lastName}`,
                email: subscriber.email,
                phoneNumber: subscriber.phoneNumber,
                category: type.category,
                startDate: (existingCard?.issuedAt ?? subscription.startDate).toFormat(
                    'dd/MM/yyyy',
                ),
                endDate: (existingCard?.expiresAt ?? subscription.endDate).toFormat('dd/MM/yyyy'),
                reference: uniqueCode,
                qrCodePath: qrPath,
            },
        })

        // Si aucune carte active n'existe encore, l'enregistrer
        let card = existingCard
        if (!existingCard) {
            card = await SubscriptionCard.create({
                subscriptionId: subscription.id,
                uniqueCode,
                issuedAt: DateTime.now(),
                expiresAt: subscription.endDate,
                isActive: true,
                qrCodePath: qrPath,
                pdfPath: pdfPath,
            })
        }

        // Nettoyage du dossier temporaire après 3 secondes
        setTimeout(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true })
        }, 3000)

        return {
            card: card!,
            pdfPath,
            qrPath,
        }
    }

    /**
     * Vérifie une carte via son code unique
     */
    static async verifyCard(code: string) {
        const card = await SubscriptionCard.query()
            .where('unique_code', code)
            .preload('subscription', (sub) =>
                sub
                    .preload('subscriber')
                    .preload('paymentVoucher', (pv) => pv.preload('subscriptionType')),
            )
            .firstOrFail()

        const subscription = card.subscription
        const now = DateTime.now()
        const isExpired = now > subscription.endDate
        const isValid = card.isActive && !isExpired

        return {
            valid: isValid,
            card: {
                uniqueCode: card.uniqueCode,
                subscriber: `${subscription.subscriber.firstName} ${subscription.subscriber.lastName}`,
                category: subscription.paymentVoucher.subscriptionType.category,
                reference: subscription.paymentVoucher.referenceCode,
                startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                isActive: card.isActive,
                expired: isExpired,
            },
            message: isValid ? 'Carte valide et active.' : 'Carte expirée ou désactivée.',
        }
    }

    /**
     * Récupère la carte active d'un utilisateur
     */
    static async getActiveCardByUserId(userId: string) {
        const card = await SubscriptionCard.query()
            .whereHas('subscription', (sub) => {
                sub.where('subscriber_id', userId)
            })
            .where('is_active', true)
            .preload('subscription', (sub) =>
                sub
                    .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                    .preload('subscriber'),
            )
            .orderBy('issued_at', 'desc')
            .first()

        if (!card) {
            throw new Error('Aucune carte active trouvée.')
        }

        return card
    }

    /**
     * Active une carte
     */
    static async activateCard(id: string) {
        const card = await SubscriptionCard.query()
            .where('id', id)
            .preload('subscription')
            .firstOrFail()

        const now = DateTime.now()
        if (now > card.subscription.endDate) {
            throw new Error("Impossible d'activer une carte expirée.")
        }

        if (card.isActive) {
            throw new Error('Cette carte est déjà active.')
        }

        card.isActive = true
        await card.save()

        return card
    }

    /**
     * Désactive une carte
     */
    static async deactivateCard(id: string) {
        const card = await SubscriptionCard.findOrFail(id)
        card.isActive = false
        await card.save()
        return card
    }

    /**
     * Liste les cartes avec filtres
     */
    static async listCards(options: {
        status?: 'active' | 'inactive'
        search?: string
        page?: number
        limit?: number
    }) {
        const { status, search = '', page = 1, limit = 10 } = options

        const query = SubscriptionCard.query()
            .preload('subscription', (sub) =>
                sub
                    .preload('subscriber')
                    .preload('paymentVoucher', (pv) => pv.preload('subscriptionType')),
            )
            .orderBy('created_at', 'desc')

        if (status === 'active') {
            query.where('is_active', true)
        } else if (status === 'inactive') {
            query.where('is_active', false)
        }

        if (search) {
            query.whereHas('subscription', (subQuery) => {
                subQuery.whereHas('subscriber', (subscriberQuery) => {
                    subscriberQuery
                        .whereILike('first_name', `%${search}%`)
                        .orWhereILike('last_name', `%${search}%`)
                        .orWhereILike('email', `%${search}%`)
                })
            })
        }

        return await query.paginate(page, limit)
    }

    /**
     * Vérifie et désactive les cartes expirées
     */
    static async checkAndDeactivateExpiredCards() {
        const now = DateTime.now()
        const expiredCards = await SubscriptionCard.query()
            .where('is_active', true)
            .where('expires_at', '<', now.toSQL())
            .preload('subscription', (sub) => sub.preload('subscriber'))

        for (const card of expiredCards) {
            card.isActive = false
            await card.save()
        }

        return expiredCards
    }
}
