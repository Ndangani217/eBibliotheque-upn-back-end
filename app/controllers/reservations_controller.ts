import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Reservation from '#models/reservation'
import Room from '#models/room'
import { Role } from '#types/role'
import { ReservationStatus } from '#types/reservationStatus'
import { createReservationValidator, updateReservationValidator } from '#validators/reservation'
import { Status } from '#types/status'
import { Console } from 'node:console'

export default class ReservationsController {
    async create({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createReservationValidator)

            // Vérifier si l'étudiant existe et a le rôle STUDENT
            const student = await User.find(payload.studentId)
            if (!student || student.role !== Role.STUDENT) {
                return response.badRequest({
                    status: 'error',
                    message: 'Utilisateur invalide, seul un étudiant peut réserver',
                })
            }

            // Vérifier si l'étudiant a déjà une réservation en attente ou approuvée
            const existingReservation = await Reservation.query()
                .where('student_id', payload.studentId)
                .whereIn('status', [ReservationStatus.EN_ATTENTE, ReservationStatus.APPROUVEE])
                .first()

            if (existingReservation) {
                return response.conflict({
                    status: 'error',
                    message:
                        'Vous avez déjà une réservation en cours. Impossible d’en créer une nouvelle.',
                    data: existingReservation,
                })
            }

            // Vérifier si la chambre existe et est disponible
            const room = await Room.find(payload.roomId)
            if (!room || !room.isAvailable || room.availableSpots <= 0) {
                return response.badRequest({
                    status: 'error',
                    message: 'Chambre non disponible',
                })
            }

            const reservation = await Reservation.create({
                studentId: payload.studentId,
                roomId: payload.roomId ?? null,
                preferredType: payload.preferredType ?? null,
                status: ReservationStatus.EN_ATTENTE,
            })

            return response.created({
                status: 'success',
                message: 'Réservation créée avec succès',
                data: reservation,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de créer la réservation',
            })
        }
    }

    // Lister toutes les réservations
    async getAllReservations({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)

            const reservations = await Reservation.query()
                .preload('student', (studentQuery) => {
                    studentQuery.preload('facultyCode')
                })
                .preload('room')
                .orderBy('created_at', 'desc')
                .paginate(page, limit)

            const serialized = reservations.toJSON()

            return response.ok({
                status: 'success',
                message: 'Réservations paginées récupérées avec succès',
                ...serialized,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer les réservations',
            })
        }
    }

    async getByStatus({ request, response }: HttpContext) {
        try {
            const status = request.input('status') as ReservationStatus

            if (!status) {
                return response.badRequest({
                    status: 'error',
                    message: 'Le paramètre "status" est requis',
                })
            }

            if (!Object.values(ReservationStatus).includes(status)) {
                return response.badRequest({
                    status: 'error',
                    message: `Statut invalide. Valeurs possibles: ${Object.values(
                        ReservationStatus,
                    ).join(', ')}`,
                })
            }

            const reservations = await Reservation.query()
                .where('status', status)
                .preload('student')
                .preload('room')

            return response.ok({
                status: 'success',
                data: reservations,
                message: `Réservations avec le statut "${status}" récupérées avec succès`,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer les réservations',
            })
        }
    }

    // Détails d’une réservation
    async getById({ params, response, auth }: HttpContext) {
        try {
            const reservation = await Reservation.query()
                .where('id', params.id)
                .preload('student')
                .preload('room')
                .firstOrFail()

            if (auth.user?.role === Role.STUDENT && reservation.studentId !== auth.user.id) {
                return response.forbidden({
                    status: 'error',
                    message: 'Accès interdit à la réservation d’un autre étudiant',
                })
            }

            return response.ok({
                status: 'success',
                data: reservation,
            })
        } catch (error) {
            return response.notFound({
                status: 'error',
                message: 'Réservation non trouvée',
            })
        }
    }

    // Mettre à jour une réservation
    async update({ params, request, auth, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(updateReservationValidator)
            const reservation = await Reservation.findOrFail(params.id)

            // Vérification ownership si c’est un étudiant
            if (auth.user?.role === Role.STUDENT && reservation.studentId !== auth.user.id) {
                return response.forbidden({
                    status: 'error',
                    message: 'Vous ne pouvez modifier que vos propres réservations',
                })
            }

            reservation.merge(payload)
            await reservation.save()

            return response.ok({
                status: 'success',
                message: 'Réservation mise à jour avec succès',
                data: reservation,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de mettre à jour la réservation',
            })
        }
    }

    // Approuver une réservation
    async approve({ params, response }: HttpContext) {
        try {
            const reservation = await Reservation.query()
                .where('id', params.id)
                .preload('student')
                .preload('room')
                .firstOrFail()

            // Vérifier si déjà approuvée
            if (reservation.status === ReservationStatus.APPROUVEE) {
                return response.badRequest({
                    status: 'error',
                    message: 'Cette réservation est déjà approuvée',
                })
            }

            // Vérifier si la chambre existe et a des places
            const room = await Room.find(reservation.roomId)
            if (!room || !room.isAvailable || room.availableSpots <= 0) {
                return response.badRequest({
                    status: 'error',
                    message: 'Impossible d’approuver, la chambre n’est pas disponible',
                })
            }

            // Vérifier rôle étudiant
            const student = await User.find(reservation.studentId)
            if (!student || student.role !== Role.STUDENT) {
                return response.badRequest({
                    status: 'error',
                    message: 'Utilisateur invalide, seul un étudiant peut être assigné',
                })
            }

            // Attacher l’étudiant à la chambre
            await room.related('students').attach([student.id])
            room.availableSpots -= 1
            await room.save()

            // Mettre à jour le statut
            reservation.status = ReservationStatus.APPROUVEE
            await reservation.save()

            return response.ok({
                status: 'success',
                message: 'Réservation approuvée et étudiant assigné avec succès',
                data: { reservation, room },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de l’approbation de la réservation',
            })
        }
    }

    async reject({ params, request, response }: HttpContext) {
        try {
            const { observationManager } = request.only(['observationManager'])
            const reservation = await Reservation.findOrFail(params.id)

            reservation.status = ReservationStatus.REFUSEE
            reservation.observationManager = observationManager ?? null
            await reservation.save()

            return response.ok({
                status: 'success',
                message: 'Réservation refusée avec succès',
                data: reservation,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec du refus de la réservation',
            })
        }
    }

    // Supprimer une réservation
    async delete({ params, response }: HttpContext) {
        try {
            const reservation = await Reservation.findOrFail(params.id)
            await reservation.delete()

            return response.ok({
                status: 'success',
                message: 'Réservation supprimée avec succès',
            })
        } catch (error) {
            return response.notFound({
                status: 'error',
                message: 'Réservation non trouvée',
            })
        }
    }

    async cancel({ params, response, auth }: HttpContext) {
        try {
            const reservation = await Reservation.query()
                .where('id', params.id)
                .preload('room')
                .preload('student')
                .firstOrFail()

            if (auth.user?.role === Role.STUDENT && reservation.studentId !== auth.user.id) {
                return response.forbidden({
                    status: 'error',
                    message: 'Vous ne pouvez annuler que vos propres réservations',
                })
            }

            if (reservation.status !== ReservationStatus.APPROUVEE) {
                return response.badRequest({
                    status: 'error',
                    message: 'Seules les réservations approuvées peuvent être annulées',
                })
            }

            // Libérer la chambre
            const room = reservation.room
            if (room) {
                await room.related('students').detach([reservation.studentId])
                room.availableSpots += 1
                room.isAvailable = true
                room.occupancyStatus = Status.DISPONIBLE
                await room.save()
            }
            reservation.status = ReservationStatus.ANNULEE
            await reservation.save()

            return response.ok({
                status: 'success',
                message: 'Réservation annulée et place libérée',
                data: reservation,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de l’annulation de la réservation',
            })
        }
    }

    //ajouter dans ReservationsController
    async searchByStudentName({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = request.input('search', '').trim()
            console.log('Search query:', search)
            console.log('Page:', page, 'Limit:', limit)

            const query = Reservation.query()
                .preload('student')
                .preload('room')
                .orderBy('created_at', 'desc')

            if (search) {
                query.whereHas('student', (studentQuery) => {
                    studentQuery
                        .whereILike('first_name', `%${search}%`)
                        .orWhereILike('last_name', `%${search}%`)
                })
            }

            const reservations = await query.paginate(page, limit)

            const serialized = reservations.toJSON()

            return response.ok({
                status: 'success',
                message: 'Résultats de recherche',
                ...serialized,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Erreur lors de la recherche des réservations',
            })
        }
    }
}
