import type { HttpContext } from '@adonisjs/core/http'
import Room from '#models/room'
import User from '#models/user'
import {
    createRoomValidator,
    updateRoomValidator,
    transferStudentValidator,
} from '#validators/room'
import { assignStudentValidator } from '#validators/user'
import { Status } from '#types/status'
import { Role } from '#types/role'

export default class RoomsController {
    // Créer une chambre
    async createRoom({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createRoomValidator)
            const room = await Room.create(payload)
            return response.created({
                status: 'success',
                message: 'Room created successfully',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({ error: 'Failed to create Room' })
        }
    }

    async getRooms({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)

            const rooms = await Room.query().orderBy('created_at', 'desc').paginate(page, limit)

            return response.ok({
                status: 'success',
                message: 'Rooms details paginated',
                meta: rooms.toJSON().meta,
                data: rooms.toJSON().data,
            })
        } catch (err) {
            console.error(err)
            return response.internalServerError({ error: 'Failed to get Rooms' })
        }
    }

    // Voir une chambre
    async getRoomById({ params, response }: HttpContext) {
        try {
            const room = await Room.query().where('id', params.id).preload('students').firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Room details',
                data: room,
            })
        } catch (err) {
            return response.internalServerError({ error: 'Failed to get Room' })
        }
    }

    // Modifier une chambre
    async updateRoom({ request, params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            const payload = await request.validateUsing(updateRoomValidator)
            room.merge(payload)
            await room.save()

            return response.accepted({
                status: 'success',
                message: 'Room Update successfully',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({ error: 'Failed to Update Room' })
        }
    }

    // Supprimer une chambre
    async deleteRoom({ params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            await room.delete()
            return response.created({
                status: 'success',
                message: 'Room Update successfully',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({ error: 'Failed to Update Room' })
        }
    }

    // Affecter un étudiant
    async assignRoomStudent({ params, request, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            const { studentId } = await request.validateUsing(assignStudentValidator)

            // Vérifier que l'étudiant existe ET a le rôle STUDENT
            const student = await User.query()
                .where('id', studentId)
                .andWhere('role', Role.STUDENT)
                .first()

            if (!student) {
                return response.notFound({
                    status: 'error',
                    message: 'Étudiant introuvable ou rôle invalide',
                })
            }

            // Vérifier si l'étudiant est déjà assigné à une chambre
            const alreadyAssignedRoom = await Room.query()
                .whereHas('students', (q) => q.where('users.id', studentId))
                .first()

            if (alreadyAssignedRoom) {
                return response.conflict({
                    status: 'error',
                    message: `Cet étudiant est déjà assigné à la chambre ${alreadyAssignedRoom.id}`,
                })
            }

            // Vérifier la capacité disponible
            if (room.availableSpots <= 0) {
                return response.conflict({
                    status: 'error',
                    message: 'Cette chambre est déjà complète',
                })
            }

            // Assigner l’étudiant
            await room.related('students').attach([studentId])

            const count = await room.related('students').query().count('* as total')
            const totalStudents = Number(count[0].$extras.total)

            room.availableSpots = room.capacity - totalStudents
            room.isAvailable = room.availableSpots > 0
            room.occupancyStatus = room.availableSpots > 0 ? Status.DISPONIBLE : Status.OCCUPEE
            await room.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant assigné avec succès',
                data: { room, student },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de l’assignation',
            })
        }
    }

    // Retirer un étudiant
    async removeRoomStudent({ request, params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            const { studentId } = await request.validateUsing(assignStudentValidator)

            // Vérifier que l'étudiant existe ET a le rôle STUDENT
            const student = await User.query()
                .where('id', studentId)
                .andWhere('role', Role.STUDENT)
                .first()

            if (!student) {
                return response.notFound({
                    status: 'error',
                    message: 'Étudiant introuvable ou rôle invalide',
                })
            }

            // Vérifier si l'étudiant est bien assigné à cette chambre
            const isAssigned = await room
                .related('students')
                .query()
                .where('users.id', studentId)
                .first()

            if (!isAssigned) {
                return response.notFound({
                    status: 'error',
                    message: 'L’étudiant n’est pas assigné à cette chambre',
                })
            }

            // Retirer l'étudiant via la table pivot
            await room.related('students').detach([studentId])

            // Libérer une place
            room.availableSpots += 1
            await room.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant retiré avec succès',
                data: { room, student },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec du retrait de l’étudiant',
            })
        }
    }

    // Lister les étudiants d'une chambre
    async getRoomStudents({ params, response }: HttpContext) {
        try {
            const room = await Room.query().where('id', params.id).preload('students').firstOrFail()

            return response.ok({
                status: 'success',
                data: room.students,
                message: 'Liste des étudiants récupérée avec succès',
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer la liste des étudiants',
            })
        }
    }

    // Chambres disponibles
    async getAvailableRooms({ response }: HttpContext) {
        try {
            const rooms = await Room.query()
                .select('id', 'location', 'type', 'availableSpots')
                .where('isAvailable', true)
                .andWhere('availableSpots', '>', 0)

            return response.ok({
                status: 'success',
                data: rooms,
                message: 'Chambres disponibles récupérées avec succès',
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer les chambres disponibles',
            })
        }
    }

    // Chambres occupées
    async getOccupiedRooms({ response }: HttpContext) {
        try {
            // Récupérer toutes les chambres où availableSpots = 0 ou occupancyStatus = 'occupied'
            const rooms = await Room.query()
                .where('availableSpots', 0)
                .orWhere('occupancyStatus', 'Occupée')

            return response.ok({
                status: 'success',
                data: rooms,
                message: 'Chambres occupées récupérées avec succès',
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer les chambres occupées',
            })
        }
    }

    // Modifier le statut
    async updateRoomStatus({ request, params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            if (!room) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }
            const { occupancyStatus } = await request.validateUsing(updateRoomValidator)
            if (occupancyStatus !== undefined) {
                room.occupancyStatus = occupancyStatus
                room.isAvailable = occupancyStatus === Status.DISPONIBLE
            }
            await room.save()

            return response.ok({
                status: 'success',
                message: 'Statut de la chambre mis à jour avec succès',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de la mise à jour du statut de la chambre',
            })
        }
    }

    // Capacité et places libres
    async getRoomCapacityInfo({ params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            if (!room) {
                return response.status(404).json({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }

            return response.ok({
                status: 'success',
                data: {
                    id: room.id,
                    type: room.type,
                    capacity: room.capacity,
                    availableSpots: room.availableSpots,
                    occupancyStatus: room.occupancyStatus,
                },
                message: 'Informations de capacité récupérées avec succès',
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible de récupérer les informations de capacité',
            })
        }
    }

    // Transférer un étudiant
    async transferStudentRoom({ params, request, response }: HttpContext) {
        try {
            const { studentId, targetRoomId } =
                await request.validateUsing(transferStudentValidator)
            // Vérifier que l'étudiant existe ET a le rôle STUDENT
            const student = await User.query()
                .where('id', studentId)
                .andWhere('role', Role.STUDENT)
                .first()

            if (!student) {
                return response.notFound({
                    status: 'error',
                    message: 'Étudiant introuvable ou rôle invalide',
                })
            }
            const sourceRoom = await Room.findOrFail(params.id)
            const targetRoom = await Room.findOrFail(targetRoomId)
            // Vérifier si l'étudiant est bien dans la chambre source
            const isInSource = await sourceRoom
                .related('students')
                .query()
                .where('users.id', studentId)
                .first()

            if (!isInSource) {
                return response.notFound({
                    status: 'error',
                    message: 'L’étudiant n’est pas assigné à la chambre source',
                })
            }

            if (targetRoom.availableSpots <= 0) {
                return response.conflict({
                    status: 'error',
                    message: 'La chambre cible n’a pas de places disponibles',
                })
            }

            // Transfert
            await sourceRoom.related('students').detach([studentId])
            sourceRoom.availableSpots += 1
            await sourceRoom.save()

            await targetRoom.related('students').attach([studentId])
            targetRoom.availableSpots -= 1
            await targetRoom.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant transféré avec succès',
                data: { sourceRoom, targetRoom, student },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec du transfert de l’étudiant',
            })
        }
    }

    // Vider une chambre
    // Vider une chambre
    async clearRoom({ params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)

            // Supprimer toutes les relations dans le pivot
            await room.related('students').detach()

            // Réinitialiser les places
            room.availableSpots = room.capacity
            await room.save()

            return response.ok({
                status: 'success',
                message: 'Chambre vidée avec succès',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec du vidage de la chambre',
            })
        }
    }

    // Recherche de chambres
    // Recherche de chambres
    async searchRooms({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = request.input('search', '')

            const query = Room.query()

            if (search) {
                query
                    .whereILike('type', `%${search}%`)
                    .orWhereILike('location', `%${search}%`)
                    .orWhereILike('occupancyStatus', `%${search}%`)
            }

            const rooms = await query.orderBy('created_at', 'desc').paginate(page, limit)

            return response.ok({
                status: 'success',
                message: 'Résultats de la recherche récupérés avec succès',
                meta: rooms.toJSON().meta,
                data: rooms.toJSON().data,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de la recherche de chambres',
            })
        }
    }
}
