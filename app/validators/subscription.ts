import vine from '@vinejs/vine'
import { SubscriptionStatus } from '#types/subscriptionStatus'
import { DateTime } from 'luxon'

export const createSubscriptionValidator = vine.compile(
    vine.object({
        studentId: vine.number().positive(),
        roomId: vine.number().positive(),
        startDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
        endDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
        status: vine.enum(SubscriptionStatus),
        reference: vine.string().trim().minLength(5),
    }),
)

export const updateSubscriptionValidator = vine.compile(
    vine.object({
        startDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
        endDate: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
        status: vine.enum(SubscriptionStatus).optional(),
        roomId: vine.number().positive().optional(),
    }),
)
