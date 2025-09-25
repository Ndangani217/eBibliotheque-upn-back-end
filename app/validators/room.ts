import vine from '@vinejs/vine'
import { Status } from '#types/status'
import { Gender } from '#types/gender'

export const createRoomValidator = vine.compile(
    vine.object({
        //id: vine.string().regex(/^[A-Z]{2}-\d{3}$/), // ex: "RM-001"
        type: vine.enum(Object.values(Gender)),
        capacity: vine.number().range([1, 4]), // Capacité max (1-4)
        occupancyStatus: vine.enum(Object.values(Status)), // Statut d’occupation
        availableSpots: vine.number().range([0, 4]), // Places disponibles (0-4)
        location: vine.string().maxLength(50), // Localisation (max 255)
        isAvailable: vine.boolean(), // Liste d’IDs ou emails
        description: vine.string().maxLength(100).optional(),
    }),
)

export const updateRoomValidator = vine.compile(
    vine.object({
        //id: vine.string().regex(/^[A-Z]{2}-\d{3}$/).optional(),
        type: vine.enum(Object.values(Gender)).optional(),
        capacity: vine.number().range([1, 4]).optional(),
        occupancyStatus: vine.enum(Object.values(Status)).optional(),
        availableSpots: vine.number().range([0, 4]).optional(),
        location: vine.string().maxLength(50).optional(),
        isAvailable: vine.boolean().optional(),
        currentMembers: vine.array(vine.number().positive()).optional(),
        description: vine.string().maxLength(100).optional(),
    }),
)

export const transferStudentValidator = vine.compile(
    vine.object({
        studentId: vine.number().positive(),
        targetRoomId: vine
            .string()
            .regex(/^[A-Z]{2}-\d{3}$/)
            .trim(),
    }),
)
