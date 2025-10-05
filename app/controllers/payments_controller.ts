import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Payment from '#models/payment'
import Subscription from '#models/subscription'
import Reservation from '#models/reservation'
import { PaymentStatus } from '#types/paymentStatus'
import { SubscriptionStatus } from '#types/subscriptionStatus'
import { createPaymentValidator, updatePaymentValidator } from '#validators/payment'
import { Period } from '#types/period'
import { getRange } from '#helpers/dateRange'
import { uploadToCloudinary } from '#services/cloudinary'
import { HandleError as handleError } from '#helpers/handleError'

export default class PaymentsController {
    /** Récupère tous les paiements (avec filtre optionnel par statut) */
    async getAllPayments({ request, response }: HttpContext) {
        try {
            const status = request.input('status')
            const query = Payment.query().preload('subscription')
            if (status) query.where('status', status)
            const payments = await query
            return response.ok({ status: 'success', data: payments })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    /** Récupère les détails d’un paiement précis par son ID */
    async getById({ params, response }: HttpContext) {
        try {
            const payment = await Payment.query()
                .where('id', params.id)
                .preload('subscription', (q) => q.preload('student'))
                .preload('reservation')
                .firstOrFail()

            return response.ok({ status: 'success', data: payment })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération du paiement')
        }
    }

    /** 🔹 Crée un paiement avec upload du fichier de preuve (Cloudinary) */
    async create({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createPaymentValidator)

            const proofFile = request.file('proof', {
                size: '5mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp'],
            })

            let proofUrl: string | null = null
            if (proofFile?.tmpPath) {
                const uploadResult = await uploadToCloudinary(proofFile, 'payments')
                if (!uploadResult.status) {
                    return response.badRequest({ status: 'error', message: uploadResult.error })
                }
                proofUrl = uploadResult.url ?? null
            }

            const payment = await Payment.create({
                subscriptionId: payload.subscriptionId ?? null,
                reference: payload.reference,
                amount: payload.amount,
                date: DateTime.now(),
                proofUrl,
                status: PaymentStatus.EN_ATTENTE,
            })

            return response.created({ status: 'success', data: payment })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la création du paiement')
        }
    }

    /** Met à jour un paiement existant (montant, statut, preuve, etc.) */
    async update({ params, request, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            const payload = await request.validateUsing(updatePaymentValidator)

            let proofUrl: string | null = payment.proofUrl ?? null
            const proofFile = request.file('proof', {
                size: '5mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp'],
            })

            if (proofFile?.tmpPath) {
                const uploadResult = await uploadToCloudinary(proofFile, 'payments')
                if (!uploadResult.status) {
                    return response.badRequest({ status: 'error', message: uploadResult.error })
                }
                proofUrl = uploadResult.url ?? null
            }

            payment.merge({ ...payload, proofUrl })
            await payment.save()

            return response.ok({ status: 'success', data: payment })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la mise à jour du paiement')
        }
    }

    /** Supprime un paiement par son ID */
    async destroy({ params, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            await payment.delete()
            return response.ok({ status: 'success', message: 'Paiement supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression du paiement')
        }
    }

    /** Récupère tous les paiements liés à un abonnement donné */
    async bySubscription({ params, response }: HttpContext) {
        try {
            const subscription = await Subscription.findOrFail(params.id)
            await subscription.load((loader) => loader.load('payments'))
            return response.ok({ status: 'success', data: subscription.payments })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    /** Met à jour le statut du paiement et crée l’abonnement si le paiement est validé */
    async updateStatus({ params, request, response }: HttpContext) {
        try {
            const payment = await Payment.findOrFail(params.id)
            const status = request.input('status')

            if (!Object.values(PaymentStatus).includes(status))
                return response.badRequest({ status: 'error', message: 'Statut invalide' })

            payment.status = status
            await payment.save()

            if (payment.status === PaymentStatus.VALIDE) {
                if (!payment.reservationId)
                    return response.badRequest({
                        status: 'error',
                        message: 'Aucune réservation liée',
                    })

                const reservation = await Reservation.find(payment.reservationId)
                if (!reservation)
                    return response.badRequest({
                        status: 'error',
                        message: 'Réservation introuvable',
                    })

                if (!reservation.roomId) {
                    return response.badRequest({
                        status: 'error',
                        message: 'Cette réservation n’est pas liée à une chambre.',
                    })
                }

                const existingSubscription = await Subscription.query()
                    .where('student_id', reservation.studentId)
                    .where('room_id', reservation.roomId)
                    .first()

                if (existingSubscription)
                    return response.conflict({
                        status: 'error',
                        message: 'Un abonnement existe déjà pour cet étudiant et cette chambre.',
                    })

                const subscription = await Subscription.create({
                    studentId: reservation.studentId,
                    roomId: reservation.roomId,
                    startDate: DateTime.now(),
                    endDate: DateTime.now().plus({ months: 1 }),
                    status: SubscriptionStatus.ACTIF,
                    reference: `SUB-${DateTime.now().toFormat('yyyyLLddHHmm')}`,
                })

                payment.subscriptionId = subscription.id
                await payment.save()
            }

            return response.ok({
                status: 'success',
                message: 'Statut du paiement mis à jour avec succès',
                data: payment,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la mise à jour du statut du paiement',
            )
        }
    }

    /** Calcule le total des paiements d’un abonnement */
    async totalBySubscription({ params, response }: HttpContext) {
        try {
            const total = await Payment.query()
                .where('subscription_id', params.id)
                .sum('amount as total')

            return response.ok({
                status: 'success',
                data: { subscriptionId: params.id, total: Number(total[0].$extras.total) || 0 },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du calcul du total')
        }
    }

    /** Recherche un paiement par sa référence bancaire */
    async searchByReference({ params, response }: HttpContext) {
        try {
            const payment = await Payment.query()
                .where('reference', params.reference)
                .preload('subscription')
                .first()

            if (!payment)
                return response.notFound({ status: 'error', message: 'Paiement introuvable' })

            return response.ok({ status: 'success', data: payment })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la recherche du paiement')
        }
    }

    /** Récupère les paiements d’un étudiant sur une période donnée */
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
                data: { payments, range: { start: start.toISO(), end: end.toISO() } },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des paiements')
        }
    }

    /** Tableau de bord global des paiements (stats résumé) */
    async dashboard({ response }: HttpContext) {
        try {
            const totalPayments = await Payment.query().count('* as total')
            const totalAmount = await Payment.query().sum('amount as total')

            const validCount = await Payment.query()
                .where('status', PaymentStatus.VALIDE)
                .count('* as total')

            const pendingCount = await Payment.query()
                .where('status', PaymentStatus.EN_ATTENTE)
                .count('* as total')

            const rejectedCount = await Payment.query()
                .where('status', PaymentStatus.REJETE)
                .count('* as total')

            const recentPayments = await Payment.query()
                .preload('subscription', (q) => q.preload('student'))
                .orderBy('created_at', 'desc')
                .limit(5)

            return response.ok({
                status: 'success',
                message: 'Données du tableau de bord récupérées avec succès',
                data: {
                    stats: {
                        totalPayments: Number(totalPayments[0].$extras.total) || 0,
                        totalAmount: Number(totalAmount[0].$extras.total) || 0,
                        validCount: Number(validCount[0].$extras.total) || 0,
                        pendingCount: Number(pendingCount[0].$extras.total) || 0,
                        rejectedCount: Number(rejectedCount[0].$extras.total) || 0,
                    },
                    recentPayments,
                },
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors du chargement du tableau de bord des paiements',
            )
        }
    }

    /** Résumé des paiements d’un étudiant sur une période donnée */
    async summaryByStudentPeriod({ params, request, response }: HttpContext) {
        try {
            const studentId = Number(params.studentId)
            const period = (request.input('period') || 'month') as Period
            const { start, end } = getRange(period)

            const payments = await Payment.query()
                .whereBetween('date', [start.toSQL()!, end.toSQL()!])
                .whereHas('subscription', (q) => q.where('student_id', studentId))
                .select('amount', 'status')

            const total = payments.reduce((sum, p) => sum + p.amount, 0)
            const validPayments = payments.filter((p) => p.status === PaymentStatus.VALIDE)
            const pendingPayments = payments.filter((p) => p.status === PaymentStatus.EN_ATTENTE)
            const rejectedPayments = payments.filter((p) => p.status === PaymentStatus.REJETE)

            return response.ok({
                status: 'success',
                message: 'Résumé des paiements récupéré avec succès',
                data: {
                    studentId,
                    period,
                    range: { start: start.toISO(), end: end.toISO() },
                    totalPayments: payments.length,
                    totalAmount: total,
                    averageAmount: payments.length ? total / payments.length : 0,
                    validCount: validPayments.length,
                    pendingCount: pendingPayments.length,
                    rejectedCount: rejectedPayments.length,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du résumé des paiements de l’étudiant')
        }
    }
}
