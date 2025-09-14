import vine from '@vinejs/vine'
import { Status } from '../types/status/index.js'

export const createRoomValidator = vine.compile(
    vine.object({
        id: vine.string().regex(/^[A-Z]{2}-\d{3}$/), // Identifiant format "AA-000"
        type: vine.string(), // Type de salle (ex: labo, amphi, bureau)
        capacity: vine.number().range([0, 10]), // Capacité max (1-100)
        occupancyStatus: vine.enum(Object.values(Status)), // Statut d’occupation
        availableSpots: vine.number().range([0, 4]), // Places disponibles (0-100)
        location: vine.string().maxLength(255), // Localisation (max 255)
        isAvailable: vine.boolean(), // Salle réservable ou non
        //currentMembers: vine.array(vine.string()).optional(), // Liste d’IDs ou emails
        description: vine.string().maxLength(500).optional(), // Description (max 500
    }),
)

export const updateRoomValidator = vine.compile(
    vine.object({
        id: vine
            .string()
            .regex(/^[A-Z]{2}-\d{3}$/)
            .optional(), // Identifiant format "AA-000"
        type: vine.string().optional(), // Type de salle (ex: labo, amphi, bureau)
        capacity: vine.number().range([0, 10]).optional(), // Capacité max (1-100)
        occupancyStatus: vine.enum(Object.values(Status)).optional(), // Statut d’occupation
        availableSpots: vine.number().range([0, 4]).optional(), // Places disponibles (0-100)
        location: vine.string().maxLength(255).optional(), // Localisation (max 255)
        isAvailable: vine.boolean().optional(), // Salle réservable ou non
        currentMembers: vine.array(vine.string()).optional(), // Liste d’IDs ou emails
        description: vine.string().maxLength(500).optional(), // Description (max 500
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
