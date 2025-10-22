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
     *Génération manuelle d’une carte d’abonnement (PDF + QR)
     */
    async generateCard({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.query()
                .where('payment_voucher_id', params.id)
                .preload('subscriber')
                .preload('paymentVoucher')
                .firstOrFail()

            const user = subscription.subscriber
            const voucher = subscription.paymentVoucher
            const uniqueCode = `CARD-${randomUUID()}`
            const verifyUrl = `https://ebibliotheque-upn.cd/verify/${uniqueCode}`

            const tmpDir = path.resolve('tmp/cards')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

            const qrPath = path.resolve(tmpDir, `qrcode_card_${uniqueCode}.png`)
            const pdfPath = path.resolve(tmpDir, `sub_card_${uniqueCode}.pdf`)
            await QRCode.toFile(qrPath, verifyUrl, { width: 250 })

            await generateSubscriptionCardPDF({
                outputPath: pdfPath,
                data: {
                    fullName: `${user.firstName} ${user.lastName}`,
                    reference: voucher.referenceCode,
                    category: voucher.category,
                    startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                    endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                    qrPath,
                    uniqueCode,
                },
            })

            const card = await SubscriptionCard.create({
                subscriptionId: subscription.id,
                uniqueCode,
                issuedAt: DateTime.now(),
                isActive: true,
                qrCodePath: qrPath,
                pdfPath,
            })

            response.header('Content-Disposition', `attachment; filename="carte_${uniqueCode}.pdf"`)
            await response.download(pdfPath)

            return response.ok({ message: 'Carte générée avec succès.', card })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la génération de la carte.')
        } finally {
            fs.rmSync('tmp/cards', { recursive: true, force: true })
        }
    }

    /**
     *Vérification publique de la carte via QR (utilisée par Next.js)
     */
    async verify({ params, response }: HttpContext) {
        try {
            const card = await SubscriptionCard.query()
                .where('unique_code', params.code)
                .preload('subscription', (sub) =>
                    sub.preload('subscriber').preload('paymentVoucher'),
                )
                .firstOrFail()

            const { subscription } = card
            const now = DateTime.now()
            const isExpired = now > subscription.endDate
            const isValid = card.isActive && !isExpired

            return response.ok({
                valid: isValid,
                card: {
                    uniqueCode: card.uniqueCode,
                    subscriber: `${subscription.subscriber.firstName} ${subscription.subscriber.lastName}`,
                    category: subscription.paymentVoucher.category,
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
}
