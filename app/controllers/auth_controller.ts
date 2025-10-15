// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import UserSessionService from '#services/user_session'
import {
    LoginValidator,
    ActivateAccountValidator,
    RequestPasswordResetValidator,
    ResetPasswordValidator,
} from '#validators/auth'

export default class AuthController {
    /**
     * 🔹 POST /auth/login
     */
    async storeSession({ request, auth, response }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(LoginValidator)
            const user = await User.findBy('email', email)

            if (!user || !user.isVerified)
                return response.unauthorized({ status: 'error', message: 'Identifiants invalides' })

            if (user.isBlocked)
                return response.forbidden({
                    status: 'error',
                    message: 'Votre compte est bloqué, contactez l’administration',
                })

            const verifiedUser = await User.verifyCredentials(email, password)
            const token = await auth.use('api').createToken(verifiedUser)
            await UserSessionService.start(verifiedUser, { request } as HttpContext)

            return response.ok({
                status: 'success',
                message: 'Connexion réussie',
                data: { token, user: verifiedUser },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de se connecter')
        }
    }

    /**
     * 🔹 DELETE /auth/logout
     */
    async destroySession({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) return response.unauthorized({ status: 'error', message: 'Non authentifié' })

            await auth.use('api').invalidateToken()
            await UserSessionService.end(user.id)

            return response.ok({ status: 'success', message: 'Déconnexion réussie' })
        } catch (error) {
            return handleError(response, error, 'Impossible de se déconnecter')
        }
    }

    /**
     * 🔹 GET /auth/me
     */
    async showAuthenticatedUser({ auth, response }: HttpContext) {
        try {
            if (!auth.user)
                return response.unauthorized({ status: 'error', message: 'Non authentifié' })

            if (auth.user.isBlocked)
                return response.forbidden({
                    status: 'error',
                    message: 'Votre compte est bloqué, contactez l’administration',
                })

            return response.ok({ status: 'success', data: { user: auth.user } })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer le profil')
        }
    }

    /**
     * 🔹 POST /auth/activate/:id
     */
    async activateAccount({ params, request, response }: HttpContext) {
        try {
            const { password, token } = await request.validateUsing(ActivateAccountValidator)
            const user = await User.find(params.id)

            if (!user)
                return response.notFound({ status: 'error', message: 'Utilisateur introuvable' })
            if (user.password)
                return response.badRequest({ status: 'error', message: 'Mot de passe déjà défini' })

            const hashed = crypto.createHash('sha256').update(token).digest('hex')
            if (user.verifyToken !== hashed)
                return response.badRequest({
                    status: 'error',
                    message: 'Lien d’activation invalide',
                })

            user.password = password
            user.isVerified = true
            user.verifyToken = null
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Compte activé et mot de passe défini',
                data: { id: user.id, email: user.email },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible d’activer le compte')
        }
    }

    /**
     * 🔹 POST /auth/forgot-password
     */
    async requestPasswordReset({ request, response }: HttpContext) {
        try {
            const { email } = await request.validateUsing(RequestPasswordResetValidator)
            const user = await User.findBy('email', email)

            if (!user)
                return response.ok({
                    status: 'success',
                    message:
                        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
                })

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')
            user.resetToken = hashed
            user.resetExpires = DateTime.utc().plus({ hours: 1 })
            await user.save()

            const resetUrl = `${process.env.FRONT_URL}/reset-password/${rawToken}`

            return response.ok({
                status: 'success',
                message: 'Un email de réinitialisation a été envoyé',
                data: { resetUrl },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible d’initier la réinitialisation')
        }
    }

    /**
     * 🔹 POST /auth/reset-password/:token
     */
    async resetPassword({ params, request, response }: HttpContext) {
        try {
            const { newPassword } = await request.validateUsing(ResetPasswordValidator)
            const hashed = crypto.createHash('sha256').update(params.token).digest('hex')

            const user = await User.query()
                .where('reset_token', hashed)
                .andWhere('reset_expires', '>', DateTime.utc().toSQL())
                .first()

            if (!user)
                return response.badRequest({ status: 'error', message: 'Lien invalide ou expiré' })

            user.password = newPassword
            user.resetToken = null
            user.resetExpires = null
            await user.save()
            await UserSessionService.end(user.id)

            return response.ok({
                status: 'success',
                message: 'Mot de passe réinitialisé avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de réinitialiser le mot de passe')
        }
    }
}
