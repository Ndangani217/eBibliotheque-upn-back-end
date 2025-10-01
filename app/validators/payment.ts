import vine from '@vinejs/vine'
import { PaymentStatus } from '#types/paymentStatus'
import { DateTime } from 'luxon'

export const createPaymentValidator = vine.compile(
    vine.object({
        subscriptionId: vine.number().positive(),
        amount: vine.number().min(1),
        reference: vine.string().trim().minLength(5),
        date: vine.date().transform((value) => DateTime.fromJSDate(value)),
        status: vine.enum(PaymentStatus),
    }),
)

export const updatePaymentValidator = vine.compile(
    vine.object({
        amount: vine.number().min(1).optional(),
        reference: vine.string().trim().minLength(5).optional(),
        status: vine.enum(PaymentStatus),
        date: vine
            .date()
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
    }),
)
