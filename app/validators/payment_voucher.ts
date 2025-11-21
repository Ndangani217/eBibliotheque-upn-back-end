import vine from '@vinejs/vine'

/**
 * Validateur pour la génération du bon de paiement
 * Vérifie les données envoyées par le front :
 * - duration : nombre positif (en mois)
 * - bank : texte obligatoire (nom ou code de la banque)
 */
export const generateVoucherValidator = vine.compile(
    vine.object({
        duration: vine.number().positive().min(1).max(12),
        bank: vine.string().trim().minLength(2).maxLength(100),
    }),
)
