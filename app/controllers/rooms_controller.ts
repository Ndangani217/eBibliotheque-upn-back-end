import type { HttpContext } from '@adonisjs/core/http'
import Room from '#models/room'
import {
    createRoomValidator,
    updateRoomValidator,
    transferStudentValidator,
} from '#validators/room'
import { assignStudentValidator } from '#validators/student'
import { Status } from '../types/status/index.js'

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

    // Lister toutes les chambres
    async getRooms({ response }: HttpContext) {
        try {
            const room = await Room.all()
            return response.ok({
                status: 'success',
                message: 'Rooms details',
                data: room,
            })
        } catch (err) {
            return response.internalServerError({ error: 'Failed to get Rooms' })
        }
    }

    // Voir une chambre
    async getRoomById({ params, response }: HttpContext) {
        try {
            const room = await Room.findBy('id', params.id)
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
            const payload = await request.validateUsing(createRoomValidator)
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
            // Récupérer la chambre par ID
            const room = await Room.findOrFail(params.id)

            if (!room) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }
            // Valider les données de la requête (ex: studentId)
            const { studentId } = await request.validateUsing(assignStudentValidator)

            // Vérifier si l'étudiant est déjà dans la chambre
            if (room.currentMembers.includes(studentId)) {
                return response.conflict({
                    status: 'error',
                    message: 'L’étudiant est déjà assigné à cette chambre',
                })
            }

            // Vérifier qu’il reste des places disponibles
            if (room.availableSpots <= 0) {
                return response.conflict({
                    status: 'error',
                    message: 'Aucune place disponible dans cette chambre',
                })
            }

            // Ajouter l’étudiant à la chambre
            room.currentMembers.push(studentId)
            room.availableSpots -= 1

            // Sauvegarder les changements
            await room.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant assigné à la chambre avec succès',
                data: room,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de l’assignation de l’étudiant',
            })
        }
    }

    // Retirer un étudiant
    async removeRoomStudent({ request, params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            if (!room) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }

            const { studentId } = await request.validateUsing(assignStudentValidator)

            if (!room.currentMembers.includes(studentId)) {
                return response.notFound({
                    status: 'error',
                    message: 'L’étudiant n’est pas assigné à cette chambre',
                })
            }

            room.currentMembers = room.currentMembers.filter((id) => id !== studentId)
            room.availableSpots += 1

            await room.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant retiré avec succès',
                data: room,
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
            const room = await Room.findOrFail(params.id)
            if (!room) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }

            const studentIds = room.currentMembers

            return response.ok({
                status: 'success',
                data: studentIds,
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
                .orWhere('occupancyStatus', 'occupied')

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
            const sourceRoom = await Room.findOrFail(params.id)

            if (!sourceRoom) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }

            if (!sourceRoom.currentMembers.includes(studentId)) {
                return response.notFound({
                    status: 'error',
                    message: 'L’étudiant n’est pas assigné à la chambre source',
                })
            }

            const targetRoom = await Room.findOrFail(targetRoomId)
            if (targetRoom.availableSpots <= 0) {
                return response.conflict({
                    status: 'error',
                    message: 'La chambre cible n’a pas de places disponibles',
                })
            }

            sourceRoom.currentMembers = sourceRoom.currentMembers.filter((id) => id !== studentId)
            sourceRoom.availableSpots += 1
            await sourceRoom.save()

            targetRoom.currentMembers.push(studentId)
            targetRoom.availableSpots -= 1
            await targetRoom.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant transféré avec succès',
                data: {
                    sourceRoom,
                    targetRoom,
                },
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
    async clearRoom({ params, response }: HttpContext) {
        try {
            const room = await Room.findOrFail(params.id)
            if (!room) {
                return response.notFound({
                    status: 'error',
                    message: 'Chambre non trouvée',
                })
            }
            room.currentMembers = []
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
    async searchRooms({ request, response }: HttpContext) {
        try {
            // Récupérer les critères depuis les paramètres de requête
            const { type, occupancyStatus, isAvailable, location } = request.qs()

            // Construire la requête
            const query = Room.query()

            if (type) {
                query.where('type', 'ilike', `%${type}%`)
            }

            if (occupancyStatus) {
                query.where('occupancyStatus', occupancyStatus)
            }

            if (isAvailable !== undefined) {
                query.where('isAvailable', isAvailable === 'true') // conversion string -> boolean
            }

            if (location) {
                query.where('location', 'ilike', `%${location}%`)
            }

            const rooms = await query

            return response.ok({
                status: 'success',
                data: rooms,
                message: 'Résultats de la recherche récupérés avec succès',
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
