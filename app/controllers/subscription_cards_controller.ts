import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import SubscriptionCard from '#models/subscription_card'
import QRCode from 'qrcode'
import path from 'node:path'
import fs from 'node:fs'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { handleError } from '#helpers/handle_error'
import { generateSubscriptionCardPDF } from '#services/pdf/subscription_card_pdf'

export default class SubscriptionCardsController {
    /**
     * 🪪 Génération manuelle d’une carte d’abonnement (PDF + QR)
     */
    async generateCard({ params, response, auth }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            const subscription = await Subscription.query()
                .where('payment_voucher_id', params.id)
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .firstOrFail()

            const { subscriber, paymentVoucher } = subscription
            const type = paymentVoucher.subscriptionType

            const uniqueCode = `CARD-${randomUUID()}`
            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`

            // 📂 Création d’un dossier temporaire unique
            const tmpDir = path.resolve(`tmp/cards/${uniqueCode}`)
            fs.mkdirSync(tmpDir, { recursive: true })

            const qrPath = path.join(tmpDir, `qrcode_${uniqueCode}.png`)
            const pdfPath = path.join(tmpDir, `card_${uniqueCode}.pdf`)
            await QRCode.toFile(qrPath, verifyUrl, { width: 250 })

            // 🧾 Génération du PDF de la carte
            await generateSubscriptionCardPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${subscriber.firstName} ${subscriber.lastName}`,
                    reference: paymentVoucher.referenceCode,
                    category: type.category, // ✅ récupérée depuis subscriptionType
                    startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                    endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                    qrPath,
                    uniqueCode,
                },
            })

            // 💾 Enregistrement de la carte
            await SubscriptionCard.create({
                subscriptionId: subscription.id,
                uniqueCode,
                issuedAt: DateTime.now(),
                isActive: true,
                qrCodePath: qrPath,
                pdfPath,
            })

            // 📤 Téléchargement du PDF généré
            response.header('Content-Disposition', `attachment; filename="carte_${uniqueCode}.pdf"`)
            await response.download(pdfPath)

            // ♻️ Nettoyage du dossier temporaire
            setTimeout(() => {
                fs.rmSync(tmpDir, { recursive: true, force: true })
            }, 3000)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération de la carte.')
        }
    }

    /**
     * ✅ Vérification publique d’une carte via QR Code
     */
    async verify({ params, response }: HttpContext) {
        try {
            const card = await SubscriptionCard.query()
                .where('unique_code', params.code)
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

            return response.ok({
                valid: isValid,
                card: {
                    uniqueCode: card.uniqueCode,
                    subscriber: `${subscription.subscriber.firstName} ${subscription.subscriber.lastName}`,
                    category: subscription.paymentVoucher.subscriptionType.category, // ✅ corrigé
                    reference: subscription.paymentVoucher.referenceCode,
                    startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                    endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                    isActive: card.isActive,
                    expired: isExpired,
                },
                message: isValid ? 'Carte valide et active.' : 'Carte expirée ou désactivée.',
            })
        } catch (error) {
            return handleError(response, error, 'Carte introuvable ou invalide.')
        }
    }

    /**
     * Récupère la carte d’abonnement active de l’utilisateur connecté
     * Endpoint : GET /payments/cards/active
     */
    async getActiveCard({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            // 🔍 Recherche de la carte active
            const card = await SubscriptionCard.query()
                .whereHas('subscription', (sub) => {
                    sub.where('subscriber_id', user.id)
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
                return response.notFound({ message: 'Aucune carte active trouvée.' })
            }

            const subscription = card.subscription

            return response.ok({
                id: card.id,
                unique_code: card.uniqueCode,
                is_active: card.isActive,
                issued_at: card.issuedAt,
                pdf_path: card.pdfPath,
                subscription: {
                    category: subscription.paymentVoucher.subscriptionType.category,
                    start_date: subscription.startDate.toISODate(),
                    end_date: subscription.endDate.toISODate(),
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement de la carte active.')
        }
    }
}
