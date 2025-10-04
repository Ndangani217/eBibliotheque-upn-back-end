import vine from '@vinejs/vine'
import { PaymentStatus } from '#types/paymentStatus'
import { DateTime } from 'luxon'

/**
 * ------------------------------
 * Validateur : création de paiement
 * ------------------------------
 * Le paiement est toujours créé avec le statut "en_attente" (par défaut)
 * et lié à un abonnement existant.
 */
export const createPaymentValidator = vine.compile(
    vine.object({
        subscriptionId: vine.number().positive(),
        amount: vine.number().min(1),
        reference: vine.string().trim().minLength(5),
        proofUrl: vine.string().trim().optional(),
        date: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .transform((value) => DateTime.fromJSDate(value)),
    }),
)

/**
 * ------------------------------
 * Validateur : mise à jour d’un paiement
 * ------------------------------
 * Permet de modifier le montant, la référence, la date
 * et surtout le statut ("validé", "rejeté", "en_attente").
 */
export const updatePaymentValidator = vine.compile(
    vine.object({
        amount: vine.number().min(1).optional(),
        reference: vine.string().trim().minLength(5).optional(),
        date: vine
            .date({ formats: ['YYYY-MM-DD'] })
            .optional()
            .transform((value) => DateTime.fromJSDate(value as Date)),
        status: vine.enum(PaymentStatus).optional(),
    }),
)
