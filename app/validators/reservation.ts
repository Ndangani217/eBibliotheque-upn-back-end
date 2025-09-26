import vine from '@vinejs/vine'
import { ReservationStatus } from '#types/reservationStatus'

// Création d'une réservation
export const createReservationValidator = vine.compile(
    vine.object({
        studentId: vine.number().positive(),
        roomId: vine.number().positive().optional().nullable(),
        preferredType: vine.string().maxLength(50).optional().nullable(),
    }),
)

// Mise à jour d'une réservation (par admin/gestionnaire)
export const updateReservationValidator = vine.compile(
    vine.object({
        status: vine.enum(Object.values(ReservationStatus)).optional(),
        observationManager: vine.string().maxLength(255).optional().nullable(),
        roomId: vine.number().positive().optional().nullable(),
    }),
)
