/**
 * Service de génération de fichiers Excel
 */
import ExcelJS from 'exceljs'
import { DateTime } from 'luxon'
import PaymentVoucher from '#models/payment_voucher'
import Subscription from '#models/subscription'
import { VoucherStatus, SubscriptionStatus } from '#enums/library_enums'
import path from 'node:path'
import fs from 'node:fs'

export interface ExportPeriod {
    startDate: DateTime
    endDate: DateTime
}

export class ExcelService {
    /**
     * Génère un fichier Excel pour les paiements
     */
    static async generatePaymentsExcel(period: ExportPeriod): Promise<string> {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Fiches de Paiement')

        // Style pour les en-têtes
        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
            border: {
                top: { style: 'thin' as const },
                left: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                right: { style: 'thin' as const },
            },
        }

        // En-têtes
        worksheet.columns = [
            { header: 'N°', key: 'index', width: 8 },
            { header: 'Code Référence', key: 'referenceCode', width: 20 },
            { header: 'Abonné', key: 'subscriberName', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Téléphone', key: 'phoneNumber', width: 15 },
            { header: 'Catégorie', key: 'category', width: 15 },
            { header: 'Montant (CDF)', key: 'amount', width: 15 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'Date de Création', key: 'createdAt', width: 20 },
            { header: 'Date de Validation', key: 'validatedAt', width: 20 },
            { header: 'Numéro Reçu Bancaire', key: 'bankReceipt', width: 20 },
        ]

        // Appliquer le style aux en-têtes
        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle
        })

        // Récupérer les paiements dans la période
        const payments = await PaymentVoucher.query()
            .whereBetween('created_at', [
                period.startDate.toSQL()!,
                period.endDate.toSQL()!,
            ])
            .preload('subscriber')
            .preload('subscriptionType')
            .orderBy('created_at', 'desc')

        // Remplir les données
        payments.forEach((payment, index) => {
            const row = worksheet.addRow({
                index: index + 1,
                referenceCode: payment.referenceCode,
                subscriberName: `${payment.subscriber?.firstName ?? ''} ${payment.subscriber?.lastName ?? ''}`.trim(),
                email: payment.subscriber?.email ?? '—',
                phoneNumber: payment.subscriber?.phoneNumber ?? '—',
                category: payment.subscriptionType?.category ?? '—',
                amount: Number(payment.amount).toFixed(2),
                status: this.getStatusLabel(payment.status),
                createdAt: payment.createdAt.toFormat('dd/MM/yyyy HH:mm'),
                validatedAt: payment.validatedAt
                    ? payment.validatedAt.toFormat('dd/MM/yyyy HH:mm')
                    : '—',
                bankReceipt: payment.bankReceiptNumber ?? '—',
            })

            // Style alterné pour les lignes
            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                })
            }
        })

        // Ajouter une ligne de total
        const totalRow = worksheet.addRow({
            index: '',
            referenceCode: 'TOTAL',
            subscriberName: '',
            email: '',
            phoneNumber: '',
            category: '',
            amount: payments
                .filter((p) => p.status === VoucherStatus.PAYE)
                .reduce((sum, p) => sum + Number(p.amount), 0)
                .toFixed(2),
            status: '',
            createdAt: '',
            validatedAt: '',
            bankReceipt: '',
        })

        totalRow.getCell(7).style = {
            font: { bold: true },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFD700' },
            },
        }

        // Créer le fichier temporaire
        const tmpDir = path.resolve('tmp/exports')
        fs.mkdirSync(tmpDir, { recursive: true })
        const fileName = `paiements_${period.startDate.toFormat('yyyy-MM-dd')}_${period.endDate.toFormat('yyyy-MM-dd')}.xlsx`
        const filePath = path.join(tmpDir, fileName)

        await workbook.xlsx.writeFile(filePath)

        return filePath
    }

    /**
     * Génère un fichier Excel pour les abonnements actifs
     */
    static async generateActiveSubscriptionsExcel(period: ExportPeriod): Promise<string> {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Abonnements Actifs')

        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF22C55E' },
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
            border: {
                top: { style: 'thin' as const },
                left: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                right: { style: 'thin' as const },
            },
        }

        worksheet.columns = [
            { header: 'N°', key: 'index', width: 8 },
            { header: 'Abonné', key: 'subscriberName', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Téléphone', key: 'phoneNumber', width: 15 },
            { header: 'Catégorie', key: 'category', width: 15 },
            { header: 'Date de Début', key: 'startDate', width: 18 },
            { header: 'Date de Fin', key: 'endDate', width: 18 },
            { header: 'Durée (mois)', key: 'duration', width: 12 },
            { header: 'Code Référence Paiement', key: 'paymentRef', width: 20 },
            { header: 'Montant (CDF)', key: 'amount', width: 15 },
            { header: 'Date de Création', key: 'createdAt', width: 20 },
        ]

        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle
        })

        const subscriptions = await Subscription.query()
            .where('status', SubscriptionStatus.VALIDE)
            .whereBetween('created_at', [
                period.startDate.toSQL()!,
                period.endDate.toSQL()!,
            ])
            .preload('subscriber')
            .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
            .orderBy('created_at', 'desc')

        subscriptions.forEach((subscription, index) => {
            const duration = subscription.endDate.diff(subscription.startDate, 'months').months
            const row = worksheet.addRow({
                index: index + 1,
                subscriberName: `${subscription.subscriber?.firstName ?? ''} ${subscription.subscriber?.lastName ?? ''}`.trim(),
                email: subscription.subscriber?.email ?? '—',
                phoneNumber: subscription.subscriber?.phoneNumber ?? '—',
                category: subscription.paymentVoucher?.subscriptionType?.category ?? '—',
                startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                duration: Math.round(duration),
                paymentRef: subscription.paymentVoucher?.referenceCode ?? '—',
                amount: subscription.paymentVoucher
                    ? Number(subscription.paymentVoucher.amount).toFixed(2)
                    : '—',
                createdAt: subscription.createdAt.toFormat('dd/MM/yyyy HH:mm'),
            })

            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                })
            }
        })

        const tmpDir = path.resolve('tmp/exports')
        fs.mkdirSync(tmpDir, { recursive: true })
        const fileName = `abonnements_actifs_${period.startDate.toFormat('yyyy-MM-dd')}_${period.endDate.toFormat('yyyy-MM-dd')}.xlsx`
        const filePath = path.join(tmpDir, fileName)

        await workbook.xlsx.writeFile(filePath)

        return filePath
    }

    /**
     * Génère un fichier Excel pour les abonnements expirés
     */
    static async generateExpiredSubscriptionsExcel(period: ExportPeriod): Promise<string> {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Abonnements Expirés')

        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF4444' },
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
            border: {
                top: { style: 'thin' as const },
                left: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                right: { style: 'thin' as const },
            },
        }

        worksheet.columns = [
            { header: 'N°', key: 'index', width: 8 },
            { header: 'Abonné', key: 'subscriberName', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Téléphone', key: 'phoneNumber', width: 15 },
            { header: 'Catégorie', key: 'category', width: 15 },
            { header: 'Date de Début', key: 'startDate', width: 18 },
            { header: 'Date de Fin', key: 'endDate', width: 18 },
            { header: 'Date d\'Expiration', key: 'expiredAt', width: 18 },
            { header: 'Durée (mois)', key: 'duration', width: 12 },
            { header: 'Code Référence Paiement', key: 'paymentRef', width: 20 },
            { header: 'Montant (CDF)', key: 'amount', width: 15 },
            { header: 'Date de Création', key: 'createdAt', width: 20 },
        ]

        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle
        })

        const subscriptions = await Subscription.query()
            .where('status', SubscriptionStatus.EXPIRE)
            .whereBetween('end_date', [
                period.startDate.toSQL()!,
                period.endDate.toSQL()!,
            ])
            .preload('subscriber')
            .preload('paymentVoucher', (pv) => pv.preload('subscriptionType'))
            .orderBy('end_date', 'desc')

        subscriptions.forEach((subscription, index) => {
            const duration = subscription.endDate.diff(subscription.startDate, 'months').months
            const row = worksheet.addRow({
                index: index + 1,
                subscriberName: `${subscription.subscriber?.firstName ?? ''} ${subscription.subscriber?.lastName ?? ''}`.trim(),
                email: subscription.subscriber?.email ?? '—',
                phoneNumber: subscription.subscriber?.phoneNumber ?? '—',
                category: subscription.paymentVoucher?.subscriptionType?.category ?? '—',
                startDate: subscription.startDate.toFormat('dd/MM/yyyy'),
                endDate: subscription.endDate.toFormat('dd/MM/yyyy'),
                expiredAt: subscription.endDate.toFormat('dd/MM/yyyy'),
                duration: Math.round(duration),
                paymentRef: subscription.paymentVoucher?.referenceCode ?? '—',
                amount: subscription.paymentVoucher
                    ? Number(subscription.paymentVoucher.amount).toFixed(2)
                    : '—',
                createdAt: subscription.createdAt.toFormat('dd/MM/yyyy HH:mm'),
            })

            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                })
            }
        })

        const tmpDir = path.resolve('tmp/exports')
        fs.mkdirSync(tmpDir, { recursive: true })
        const fileName = `abonnements_expires_${period.startDate.toFormat('yyyy-MM-dd')}_${period.endDate.toFormat('yyyy-MM-dd')}.xlsx`
        const filePath = path.join(tmpDir, fileName)

        await workbook.xlsx.writeFile(filePath)

        return filePath
    }

    /**
     * Convertit le statut en libellé français
     */
    private static getStatusLabel(status: VoucherStatus): string {
        const labels: Record<VoucherStatus, string> = {
            [VoucherStatus.EN_ATTENTE]: 'En attente',
            [VoucherStatus.PAYE]: 'Payé',
            [VoucherStatus.EXPIRE]: 'Expiré',
            [VoucherStatus.ANNULE]: 'Annulé',
        }
        return labels[status] || status
    }
}

