import vine from '@vinejs/vine'

/**
 * Validation pour la connexion utilisateur
 * Route : POST /auth/login
 */
export const LoginValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email(),
        password: vine.string().minLength(6),
    }),
)

/**
 * Validation pour l’activation du compte
 * Route : POST /auth/activate/:id
 */
export const ActivateAccountValidator = vine.compile(
    vine.object({
        token: vine.string().trim(),
        password: vine.string().minLength(6).confirmed(),
    }),
)

/**
 * Validation pour la demande de réinitialisation de mot de passe
 * Route : POST /auth/forgot-password
 */
export const RequestPasswordResetValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email(),
    }),
)

/**
 * Validation pour la réinitialisation du mot de passe
 * Route : POST /auth/reset-password/:token
 */
export const ResetPasswordValidator = vine.compile(
    vine.object({
        newPassword: vine.string().minLength(6).confirmed(),
    }),
)

export const RegisterSubscriberValidator = vine.compile(
    vine.object({
        firstName: vine.string().trim().minLength(2),
        lastName: vine.string().trim().minLength(2),
        email: vine.string().trim().email(),
        phoneNumber: vine
            .string()
            .trim()
            .regex(/^(?:\+243|0)?[0-9]{9}$/),
        category: vine.string().trim(),
    }),
)

export const SetPasswordValidator = vine.compile(
    vine.object({
        password: vine.string().minLength(6).confirmed(),
    }),
)
