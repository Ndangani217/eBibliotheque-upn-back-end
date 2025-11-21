import type { HttpContext } from '@adonisjs/core/http'
import { handleError } from '#helpers/handle_error'
import { ApiResponseHelper } from '#helpers/api_response'
import { AuthService } from '#services/auth/auth_service'
import {
    LoginValidator,
    RequestPasswordResetValidator,
    ResetPasswordValidator,
    SetPasswordValidator,
} from '#validators/auth'

export default class AuthController {
    async storeSession({ request, response, ...httpContext }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(LoginValidator)
            const result = await AuthService.login(email, password, {
                request,
                response,
                ...httpContext,
            } as HttpContext)

            return ApiResponseHelper.success(
                response,
                {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
                'Login successful',
            )
        } catch (error: any) {
            if (error.message === 'Invalid credentials or account not verified.') {
                return ApiResponseHelper.unauthorized(response, error.message)
            }
            if (error.message === 'Your account is blocked. Please contact the administrator.') {
                return ApiResponseHelper.forbidden(response, error.message)
            }
            return handleError(response, error, 'Unable to log in')
        }
    }

    async destroySession({ auth, response, ...httpContext }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return ApiResponseHelper.unauthorized(response, 'Not authenticated')
            }

            await AuthService.logout(user, { auth, response, ...httpContext } as HttpContext)

            return ApiResponseHelper.success(response, null, 'Logout successful')
        } catch (error) {
            return handleError(response, error, 'Unable to log out')
        }
    }

    async setPassword({ request, params, response }: HttpContext) {
        try {
            const token = params.token
            const { newPassword } = await request.validateUsing(SetPasswordValidator)

            await AuthService.setPassword(token, newPassword)

            return ApiResponseHelper.success(response, null, 'Mot de passe défini avec succès.')
        } catch (error: any) {
            if (error.message === 'Invalid or expired link.') {
                return ApiResponseHelper.error(response, 'Lien invalide ou expiré.', 400)
            }
            return handleError(response, error, 'Impossible de définir le mot de passe')
        }
    }

    async requestPasswordReset({ request, response }: HttpContext) {
        try {
            const { email } = await request.validateUsing(RequestPasswordResetValidator)
            const result = await AuthService.requestPasswordReset(email)

            return ApiResponseHelper.success(response, null, result.message)
        } catch (error) {
            return handleError(response, error, 'Unable to initiate password reset')
        }
    }

    /**
     * Vérifie si un token de réinitialisation est valide (GET)
     */
    async verifyResetToken({ params, response }: HttpContext) {
        try {
            const isValid = await AuthService.verifyResetToken(params.token)

            if (!isValid) {
                return ApiResponseHelper.error(
                    response,
                    'Lien de réinitialisation invalide ou expiré.',
                    404,
                )
            }

            return ApiResponseHelper.success(response, { valid: true }, 'Token valide.')
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la vérification du token')
        }
    }

    async resetPassword({ params, request, response }: HttpContext) {
        try {
            const { newPassword } = await request.validateUsing(ResetPasswordValidator)
            await AuthService.resetPassword(params.token, newPassword)

            return ApiResponseHelper.success(response, null, 'Password successfully reset.')
        } catch (error: any) {
            if (error.message === 'Invalid or expired password reset link.') {
                return ApiResponseHelper.error(response, error.message, 400)
            }
            return handleError(response, error, 'Unable to reset password')
        }
    }

    async refreshToken({ request, response, ...httpContext }: HttpContext) {
        try {
            const { refreshToken } = request.only(['refreshToken'])

            if (!refreshToken) {
                return ApiResponseHelper.error(response, 'Refresh token missing.', 400)
            }

            const result = await AuthService.refreshAccessToken(refreshToken, {
                request,
                response,
                ...httpContext,
            } as HttpContext)

            return ApiResponseHelper.success(
                response,
                {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
                'Token refreshed successfully',
            )
        } catch (error: any) {
            if (error.message === 'Invalid or expired refresh token.') {
                return ApiResponseHelper.unauthorized(response, error.message)
            }
            if (error.message === 'User not found.') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            return handleError(response, error, 'Unable to refresh access token')
        }
    }

    async showAuthenticatedUser({ response, ...httpContext }: HttpContext) {
        try {
            const user = await AuthService.getAuthenticatedUser({
                response,
                ...httpContext,
            } as HttpContext)

            return ApiResponseHelper.success(response, { user }, 'User retrieved successfully')
        } catch (error: any) {
            if (error.message === 'Not authenticated') {
                return ApiResponseHelper.unauthorized(response, 'Non authentifié')
            }
            if (error.message === 'Your account is blocked. Please contact the administrator.') {
                return ApiResponseHelper.forbidden(
                    response,
                    "Votre compte est bloqué, contactez l'administration",
                )
            }
            console.error('Auth error:', error)
            return ApiResponseHelper.unauthorized(response, 'Token invalide ou expiré')
        }
    }
}
