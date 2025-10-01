import vine from '@vinejs/vine'
import { SubscriptionStatus } from '#types/subscriptionStatus'

export const createSubscriptionValidator = vine.compile(
    vine.object({
        studentId: vine.number().positive(),
        roomId: vine.number().positive(),
        startDate: vine.date({ formats: ['YYYY-MM-DD'] }),
        endDate: vine.date({ formats: ['YYYY-MM-DD'] }),
        status: vine.enum(SubscriptionStatus),
        reference: vine.string().trim().minLength(5),
    }),
)

export const updateSubscriptionValidator = vine.compile(
    vine.object({
        startDate: vine.date().optional(),
        endDate: vine.date().optional(),
        status: vine.enum(SubscriptionStatus),
    }),
)
