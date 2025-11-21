/**
 * Service de gestion des paiements
 */
import PaymentVoucher from '#models/payment_voucher'
import SubscriptionType from '#models/subscription_type'
import { VoucherStatus, SubscriberCategory } from '#enums/library_enums'
import { DateTime } from 'luxon'
import { generateVoucherPDF } from '#services/pdf/payment_pdfs'
import QRCode from 'qrcode'
import path from 'node:path'
import fs from 'node:fs'
import type User from '#models/user'

export interface GenerateVoucherPayload {
    duration: number
    bank: string
    user: User
}

export interface ValidatePaymentResult {
    voucher: PaymentVoucher
    subscription: any
    card: any
    qrPreview: string
}

export class PaymentService {
    /**
     * Génère un bon de paiement
     */
    static async generateVoucher(payload: GenerateVoucherPayload) {
        const { duration, bank, user } = payload
        const category = (user.category ?? SubscriberCategory.STUDENT) as SubscriberCategory

        // Trouve la formule correspondante
        const type = await SubscriptionType.query()
            .where('is_active', true)
            .where('category', category)
            .where('duration_months', duration)
            .first()

        if (!type) {
            throw new Error(`Aucun tarif trouvé pour ${category} (${duration} mois).`)
        }

        // Vérifie s'il existe déjà un bon en attente
        const existingVoucher = await PaymentVoucher.query()
            .where('subscriber_id', user.id)
            .where('subscription_type_id', type.id)
            .whereIn('status', [VoucherStatus.EN_ATTENTE])
            .orderBy('created_at', 'desc')
            .first()

        // Prépare le dossier temporaire
        const tmpDir = path.resolve('tmp/vouchers')
        fs.mkdirSync(tmpDir, { recursive: true })

        let voucher = existingVoucher
        let referenceCode = existingVoucher?.referenceCode || `BON-${Date.now()}`
        let createdAt = existingVoucher?.createdAt || DateTime.now()
        let amount = type.price

        // Si aucun bon valide, en créer un nouveau
        if (!existingVoucher) {
            voucher = await PaymentVoucher.create({
                referenceCode,
                bankReceiptNumber: bank,
                amount,
                status: VoucherStatus.EN_ATTENTE,
                subscriberId: user.id,
                subscriptionTypeId: type.id,
            })
        }

        // Génération du QR + PDF
        const qrPath = path.join(tmpDir, `qrcode_${referenceCode}.png`)
        const pdfPath = path.join(tmpDir, `voucher_${referenceCode}.pdf`)

        await QRCode.toFile(qrPath, referenceCode, { width: 250 })

        await generateVoucherPDF({
            outputPath: pdfPath,
            data: {
                fullName: `${user.firstName} ${user.lastName}`,
                category,
                duration: type.durationMonths,
                bank,
                amount,
                reference: referenceCode,
                qrCodePath: qrPath,
                createdAt: createdAt.toFormat('dd/MM/yyyy'),
            },
        })

        // Nettoyage automatique après 3 secondes
        setTimeout(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true })
        }, 3000)

        return {
            voucher,
            pdfPath,
            referenceCode,
        }
    }

    /**
     * Liste les paiements avec filtres
     */
    static async listPayments(options: {
        status?: string
        search?: string
        page?: number
        limit?: number
    }) {
        const { status, search = '', page = 1, limit = 10 } = options

        const query = PaymentVoucher.query()
            .preload('subscriber')
            .preload('subscriptionType')
            .orderBy('created_at', 'desc')

        if (status) {
            query.where('status', status)
        }

        if (search) {
            query.where((q) => {
                q.whereILike('reference_code', `%${search}%`)
                    .orWhereHas('subscriber', (sub) =>
                        sub
                            .whereILike('first_name', `%${search}%`)
                            .orWhereILike('last_name', `%${search}%`),
                    )
            })
        }

        return await query.paginate(page, limit)
    }

    /**
     * Récupère un paiement par ID
     */
    static async getPaymentById(id: string) {
        const voucher = await PaymentVoucher.query()
            .where('id', id)
            .preload('subscriber')
            .preload('subscriptionType')
            .first()

        if (!voucher) {
            throw new Error('Payment voucher not found')
        }

        return voucher
    }
}

