import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { ConductType, ConductStatus } from '#types/conduct'

export const createConductValidator = vine.compile(
    vine.object({
        studentId: vine.number().positive(),
        responsableId: vine.number().positive(),
        type: vine.enum(Object.values(ConductType)),
        status: vine.enum(Object.values(ConductStatus)),
        description: vine.string().trim().minLength(5).maxLength(500),
        attachment: vine.string().optional().nullable(),
        date: vine.date().transform((value) => DateTime.fromJSDate(value)),
    }),
)

export const updateConductValidator = vine.compile(
    vine.object({
        type: vine.enum(Object.values(ConductType)).optional(),
        status: vine.enum(Object.values(ConductStatus)).optional(),
        description: vine.string().trim().minLength(5).maxLength(500).optional(),
        attachment: vine.string().optional().nullable(),
        date: vine
            .date()
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
    }),
)
