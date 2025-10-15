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
} from '#validators/auth'
import { RegisterSubscriberValidator, SetPasswordValidator } from '#validators/user'
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
            const accessToken = await auth.use('api').createToken(verifiedUser) // ✅ correction ici

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

    async showAuthenticatedUser({ auth, response }: HttpContext) {
        try {
            if (!auth.user) {
                return response.unauthorized({ status: 'error', message: 'Not authenticated' })
            }

            if (auth.user.isBlocked) {
                return response.forbidden({
                    status: 'error',
                    message: 'Your account is blocked. Please contact the administrator.',
                })
            }

            return response.ok({ status: 'success', data: { user: auth.user } })
        } catch (error) {
            return handleError(response, error, 'Unable to fetch user profile')
        }
    }

    async registerSubscriber({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(RegisterSubscriberValidator)

            const existing = await User.query()
                .where('email', payload.email)
                .orWhere('phone_number', payload.phoneNumber)
                .first()

            if (existing) {
                return response.badRequest({
                    status: 'error',
                    message: 'A user with this email or phone number already exists.',
                })
            }

            const user = await User.create({
                ...payload,
                isVerified: false,
                isBlocked: false,
            })

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.verifyToken = hashed
            user.resetExpires = DateTime.utc().plus({ hours: 24 })
            await user.save()

            const url = `${env.get('FRONT_URL')}/set-password?userId=${user.id}&token=${rawToken}`

            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activate your account')
                    .htmlView('emails/activation', { user, url })
            })

            return response.created({
                status: 'success',
                message: 'Subscriber created. Please check your email to set your password.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to register subscriber')
        }
    }

    async setPassword({ request, response }: HttpContext) {
        try {
            const { userId, token, password } = await request.validateUsing(SetPasswordValidator)

            const hashed = crypto.createHash('sha256').update(token).digest('hex')
            const user = await User.query()
                .where('id', userId)
                .andWhere('verify_token', hashed)
                .andWhere('verify_expires', '>', DateTime.utc().toSQL())
                .first()

            if (!user) {
                return response.badRequest({
                    status: 'error',
                    message: 'Invalid or expired activation link.',
                })
            }

            user.password = password
            user.isVerified = true
            user.verifyToken = null
            user.resetExpires = null
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Password set successfully. You can now log in.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to set password')
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
            user.resetExpires = DateTime.utc().plus({ hours: 1 })
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
            user.resetExpires = null
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
}
