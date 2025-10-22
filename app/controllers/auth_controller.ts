import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import RefreshToken from '#models/refresh_token'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import { handleError } from '#helpers/handle_error'
import UserSessionService from '#services/user_session'
import {
    LoginValidator,
    RequestPasswordResetValidator,
    ResetPasswordValidator,
    SetPasswordValidator,
} from '#validators/auth'
import env from '#start/env'
import Mail from '@adonisjs/mail/services/main'

export default class AuthController {
    async storeSession({ request, auth, response }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(LoginValidator)
            const user = await User.findBy('email', email)

            if (!user || !user.isVerified) {
                return response.unauthorized({
                    status: 'error',
                    message: 'Invalid credentials or account not verified.',
                })
            }

            if (user.isBlocked) {
                return response.forbidden({
                    status: 'error',
                    message: 'Your account is blocked. Please contact the administrator.',
                })
            }

            const verifiedUser = await User.verifyCredentials(email, password)
            const accessToken = await auth.use('api').createToken(verifiedUser)

            const refreshToken = crypto.randomBytes(40).toString('hex')
            await RefreshToken.create({
                userId: verifiedUser.id,
                token: refreshToken,
                expiresAt: DateTime.utc().plus({ days: 7 }),
            })

            await UserSessionService.start(verifiedUser, { request } as HttpContext)

            return response.ok({
                status: 'success',
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: verifiedUser,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Unable to log in')
        }
    }

    async destroySession({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ status: 'error', message: 'Not authenticated' })
            }

            await auth.use('api').invalidateToken()
            await UserSessionService.end(user.id)

            return response.ok({ status: 'success', message: 'Logout successful' })
        } catch (error) {
            return handleError(response, error, 'Unable to log out')
        }
    }

    async setPassword({ request, params, response }: HttpContext) {
        try {
            const token = params.token
            const { newPassword } = await request.validateUsing(SetPasswordValidator)

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

            const user = await User.query()
                .where('verify_token', hashedToken)
                .where('verify_expires', '>', DateTime.utc().toSQL())
                .first()

            if (!user) {
                return response.badRequest({ message: 'Lien invalide ou expiré.' })
            }

            user.password = newPassword
            user.isVerified = true
            user.verifyToken = null
            user.verifyExpires = null
            await user.save()

            return response.ok({ message: 'Mot de passe défini avec succès.' })
        } catch (error) {
            return handleError(response, error, 'Impossible de définir le mot de passe')
        }
    }

    async requestPasswordReset({ request, response }: HttpContext) {
        try {
            const { email } = await request.validateUsing(RequestPasswordResetValidator)
            const user = await User.findBy('email', email)

            if (!user) {
                return response.ok({
                    status: 'success',
                    message: 'If an account exists, a reset link has been sent.',
                })
            }

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')
            user.resetToken = hashed
            user.verifyExpires = DateTime.utc().plus({ hours: 1 })
            await user.save()

            const resetUrl = `${env.get('FRONT_URL')}/reset-password/${rawToken}`

            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Password Reset Request')
                    .htmlView('emails/reset_password', { user, resetUrl })
            })

            return response.ok({
                status: 'success',
                message: 'Password reset link sent to your email.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to initiate password reset')
        }
    }

    async resetPassword({ params, request, response }: HttpContext) {
        try {
            const { newPassword } = await request.validateUsing(ResetPasswordValidator)
            const hashed = crypto.createHash('sha256').update(params.token).digest('hex')

            const user = await User.query()
                .where('reset_token', hashed)
                .andWhere('reset_expires', '>', DateTime.utc().toSQL())
                .first()

            if (!user) {
                return response.badRequest({
                    status: 'error',
                    message: 'Invalid or expired password reset link.',
                })
            }

            user.password = newPassword
            user.resetToken = null
            user.verifyExpires = null
            await user.save()

            await UserSessionService.end(user.id)

            return response.ok({
                status: 'success',
                message: 'Password successfully reset.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to reset password')
        }
    }

    async refreshToken({ request, auth, response }: HttpContext) {
        try {
            const { refreshToken } = request.only(['refreshToken'])

            if (!refreshToken) {
                return response.badRequest({ status: 'error', message: 'Refresh token missing.' })
            }

            const stored = await RefreshToken.query()
                .where('token', refreshToken)
                .andWhere('is_revoked', false)
                .first()

            if (!stored || stored.expiresAt < DateTime.utc()) {
                return response.unauthorized({
                    status: 'error',
                    message: 'Invalid or expired refresh token.',
                })
            }

            const user = await User.find(stored.userId)
            if (!user) {
                return response.notFound({ status: 'error', message: 'User not found.' })
            }

            stored.isRevoked = true
            await stored.save()

            const accessToken = await auth.use('api').createToken(user)

            const newRefreshToken = crypto.randomBytes(40).toString('hex')
            await RefreshToken.create({
                userId: user.id,
                token: newRefreshToken,
                expiresAt: DateTime.utc().plus({ days: 7 }),
            })

            return response.ok({
                status: 'success',
                message: 'Token refreshed successfully',
                data: {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Unable to refresh access token')
        }
    }

    async showAuthenticatedUser({ auth, response }: HttpContext) {
        try {
            // Authentifie l'utilisateur via le guard "api"
            const user = await auth.use('api').authenticate()

            if (!user) {
                return response.unauthorized({
                    status: 'error',
                    message: 'Non authentifié',
                })
            }

            if (user.isBlocked) {
                return response.forbidden({
                    status: 'error',
                    message: 'Votre compte est bloqué, contactez l’administration',
                })
            }

            return response.ok({
                status: 'success',
                data: { user },
            })
        } catch (error) {
            console.error('Auth error:', error)
            return response.unauthorized({
                status: 'error',
                message: 'Token invalide ou expiré',
            })
        }
    }
}
