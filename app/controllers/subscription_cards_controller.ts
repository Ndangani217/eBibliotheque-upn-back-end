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
     * 🪪 Génère à la volée la carte d’un abonnement existant
     * - Aucun fichier n’est stocké définitivement
     * - Regénère la même carte si elle est encore active
     */
    async generateCard({ params, response, auth }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            // 🔍 Recherche l’abonnement lié au bon
            const subscription = await Subscription.query()
                .where('payment_voucher_id', params.id)
                .preload('subscriber')
                .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
                .firstOrFail()

            // Vérifie la validité
            const now = DateTime.now()
            const isExpired = now > subscription.endDate
            if (isExpired) {
                return response.badRequest({
                    message: 'L’abonnement est expiré, carte non disponible.',
                })
            }

            const { subscriber, paymentVoucher } = subscription
            const type = paymentVoucher.subscriptionType

            // Vérifie s’il existe déjà une carte active
            const existingCard = await SubscriptionCard.query()
                .where('subscription_id', subscription.id)
                .where('is_active', true)
                .first()

            const uniqueCode = existingCard?.uniqueCode || `CARD-${randomUUID()}`
            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`

            // 📂 Création d’un dossier temporaire
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
                    category: type.category,
                    startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                    endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                    qrPath,
                    uniqueCode,
                },
            })

            // 📤 Téléchargement du PDF généré
            response.header('Content-Disposition', `attachment; filename="carte_${uniqueCode}.pdf"`)
            await response.download(pdfPath)

            // Si aucune carte active n’existe, l’enregistrer en base
            if (!existingCard) {
                await SubscriptionCard.create({
                    subscriptionId: subscription.id,
                    uniqueCode,
                    issuedAt: DateTime.now(),
                    isActive: true,
                })
            }

            //Nettoyage du dossier temporaire
            setTimeout(() => {
                fs.rmSync(tmpDir, { recursive: true, force: true })
            }, 3000)
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération de la carte.')
        }
    }

    /**
     * Vérification publique d’une carte via QR Code
     * - Accessible sans authentification
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
                    category: subscription.paymentVoucher.subscriptionType.category,
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
     */
    async getActiveCard({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

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
            const now = DateTime.now()
            const isExpired = now > subscription.endDate

            return response.ok({
                id: card.id,
                unique_code: card.uniqueCode,
                is_active: card.isActive,
                issued_at: card.issuedAt,
                subscription: {
                    category: subscription.paymentVoucher.subscriptionType.category,
                    start_date: subscription.startDate.toISODate(),
                    end_date: subscription.endDate.toISODate(),
                    expired: isExpired,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du chargement de la carte active.')
        }
    }

    /**
     *Activation manuelle d’une carte d’abonnement
     * Endpoint : PATCH /payments/cards/:id/activate
     */
    async activateCard({ params, auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ message: 'Utilisateur non authentifié.' })
            }

            //Vérifie si la carte existe
            const card = await SubscriptionCard.query()
                .where('id', params.id)
                .preload('subscription', (sub) =>
                    sub.preload('subscriber').preload('paymentVoucher'),
                )
                .first()

            if (!card) {
                return response.notFound({ message: 'Carte introuvable.' })
            }

            //(Optionnel) Vérifie que seul un admin/manager peut activer
            /*if (user.role !== 'admin' && user.role !== 'manager') {
                return response.forbidden({
                    message: 'Seul un administrateur ou manager peut activer une carte.',
                })
            }*/

            //Vérifie que l’abonnement est encore valide
            const now = DateTime.now()
            const sub = card.subscription
            if (now > sub.endDate) {
                return response.badRequest({
                    message: 'Impossible d’activer une carte expirée.',
                })
            }
            if (card.isActive) {
                return response.ok({ message: 'Cette carte est déjà active.' })
            }

            card.isActive = true
            await card.save()

            return response.ok({
                message: 'Carte activée avec succès.',
                card: {
                    id: card.id,
                    uniqueCode: card.uniqueCode,
                    isActive: card.isActive,
                    subscriber: `${sub.subscriber.firstName} ${sub.subscriber.lastName}`,
                    reference: sub.paymentVoucher.referenceCode,
                    endDate: sub.endDate.toFormat('dd/MM/yyyy'),
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de l’activation de la carte.')
        }
    }
}
