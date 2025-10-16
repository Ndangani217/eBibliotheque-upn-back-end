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

/**
 * Validation pour l’activation de compte (définition du mot de passe)
 * Route : POST /auth/set-password
 */
export const SetPasswordValidator = vine.compile(
    vine.object({
        newPassword: vine.string().minLength(6).confirmed(),
    }),
)
