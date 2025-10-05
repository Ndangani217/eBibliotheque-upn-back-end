import { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'
import Subscription from '#models/subscription'
import { createPaymentValidator, updatePaymentValidator } from '#validators/payment'
import { Period } from '#types/period'
import { getRange } from '#helpers/dateRange'
import { uploadToCloudinary } from '#services/cloudinary'
import { HandleError as handleError } from '#helpers/handleError'

export default class PaymentsController {
    // 1 Liste de tous les paiements
    async getAllPayments({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const query = Payment.query().preload('subscription')
            if (status) query.where('status', status)

            const payments = await query
            return response.ok({
                status: 'success',
                message: 'Paiements récupérés avec succès',
                data: payments,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    // Détails d’un paiement
    async getById({ params, response }: HttpContext) {
        try {
            const payment = await Payment.query()
                .where('id', params.id)
                .preload('subscription', (q) => q.preload('student'))
                .firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Paiement récupéré avec succès',
                data: payment,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération du paiement')
        }
    }

    // Créer un paiement avec upload Cloudinary
    async create({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createPaymentValidator)
            let proofUrl: string | null = null
            const proofFile = request.file('proof', {
                size: '5mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
            })

            if (proofFile) {
                const uploadResult = await uploadToCloudinary(proofFile, 'payments')

                if (!uploadResult.status) {
                    return response.badRequest({
                        status: 'error',
                        message: uploadResult.error,
                    })
                }
                proofUrl = uploadResult.url ?? null
            }
            const payment = await Payment.create({
                ...payload,
                proofUrl,
            })

            return response.created({
                status: 'success',
                message: 'Paiement créé avec succès',
                data: payment,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la création du paiement')
        }
    }

    // Mettre à jour un paiement (y compris la preuve Cloudinary)
    async update({ params, request, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            const payload = await request.validateUsing(updatePaymentValidator)

            let proofUrl: string | null = payment.proofUrl ?? null

            const proofFile = request.file('proof', {
                size: '5mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
            })

            if (proofFile) {
                const uploadResult = await uploadToCloudinary(proofFile, 'payments')

                if (!uploadResult.status) {
                    return response.badRequest({
                        status: 'error',
                        message: uploadResult.error,
                    })
                }

                proofUrl = uploadResult.url ?? null
            }

            payment.merge({
                ...payload,
                proofUrl,
            })
            await payment.save()

            return response.ok({
                status: 'success',
                message: 'Paiement mis à jour avec succès',
                data: payment,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la mise à jour du paiement')
        }
    }

    //Supprimer un paiement
    async destroy({ params, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            await payment.delete()

            return response.ok({
                status: 'success',
                message: 'Paiement supprimé avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression du paiement')
        }
    }

    // Paiements d’un abonnement
    async bySubscription({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.findOrFail(params.id)
            await subscription.load('payments')

            return response.ok({
                status: 'success',
                message: 'Paiements liés à l’abonnement récupérés avec succès',
                data: subscription.payments,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la récupération des paiements de l’abonnement',
            )
        }
    }

    // Total payé pour un abonnement
    async totalBySubscription({ params, response }: HttpContext) {
        try {
            const total = await Payment.query()
                .where('subscription_id', params.id)
                .sum('amount as total')

            return response.ok({
                status: 'success',
                message: 'Total des paiements récupéré avec succès',
                data: {
                    subscriptionId: params.id,
                    total: Number(total[0].$extras.total) || 0,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du calcul du total')
        }
    }

    // Changer le statut
    async updateStatus({ params, request, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            const status = request.input('status')

            if (!['validé', 'en attente', 'rejeté'].includes(status)) {
                return response.badRequest({
                    status: 'error',
                    message: 'Statut invalide',
                })
            }

            payment.status = status
            await payment.save()

            return response.ok({
                status: 'success',
                message: 'Statut du paiement mis à jour avec succès',
                data: payment,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la mise à jour du statut')
        }
    }

    // Rechercher par référence bancaire
    async searchByReference({ params, response }: HttpContext) {
        try {
            const payment = await Payment.query()
                .where('reference', params.reference)
                .preload('subscription')
                .first()

            if (!payment) {
                return response.notFound({
                    status: 'error',
                    message: 'Paiement introuvable',
                })
            }

            return response.ok({
                status: 'success',
                message: 'Paiement trouvé',
                data: payment,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la recherche du paiement')
        }
    }

    // Paiements d’un étudiant selon période
    async byStudentPeriod({ params, request, response }: HttpContext) {
        try {
            const studentId = Number(params.studentId)
            const period = (request.input('period') || 'day') as Period
            const { start, end } = getRange(period)

            const page = request.input('page', 1)
            const limit = 10

            const payments = await Payment.query()
                .whereBetween('date', [start.toSQL()!, end.toSQL()!])
                .whereHas('subscription', (q) => q.where('student_id', studentId))
                .preload('subscription', (q) => q.preload('student'))
                .orderBy('date', 'desc')
                .paginate(page, limit)

            payments.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: `Paiements de l’étudiant ${studentId} récupérés avec succès`,
                data: { payments, range: { start: start.toISO(), end: end.toISO() } },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    // 11 Résumé des paiements par période
    async summaryByStudentPeriod({ params, request, response }: HttpContext) {
        try {
            const studentId = Number(params.studentId)
            const period = (request.input('period') || 'day') as Period
            const { start, end } = getRange(period)

            const rows = await Payment.query()
                .whereBetween('date', [start.toSQL()!, end.toSQL()!])
                .whereHas('subscription', (q) => q.where('student_id', studentId))
                .sum('amount as total')
                .count('* as count')

            return response.ok({
                status: 'success',
                message: `Résumé récupéré avec succès`,
                data: {
                    total: Number(rows[0].$extras.total ?? 0),
                    count: Number(rows[0].$extras.count ?? 0),
                    range: { start: start.toISO(), end: end.toISO() },
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du résumé des paiements')
        }
    }

    // Dashboard global
    async dashboard({ request, response }: HttpContext) {
        try {
            const periods: Period[] = [Period.Day, Period.Week, Period.Month, Period.Year]
            const page = request.input('page', 1)
            const limit = 10

            const results = await Promise.all(
                periods.map(async (p) => {
                    const { start, end } = getRange(p)

                    const payments = await Payment.query()
                        .whereBetween('date', [start.toSQL()!, end.toSQL()!])
                        .preload('subscription', (q) => q.preload('student'))
                        .orderBy('date', 'desc')
                        .paginate(page, limit)

                    const rows = await Payment.query()
                        .whereBetween('date', [start.toSQL()!, end.toSQL()!])
                        .sum('amount as total')
                        .count('* as count')

                    return {
                        period: p,
                        range: { start: start.toISO(), end: end.toISO() },
                        total: Number(rows[0].$extras.total ?? 0),
                        count: Number(rows[0].$extras.count ?? 0),
                        payments,
                    }
                }),
            )

            return response.ok({
                status: 'success',
                message: 'Dashboard global des paiements généré avec succès',
                data: { summary: results },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du dashboard des paiements')
        }
    }
}
