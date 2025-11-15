/**
 * Service d'authentification
 */
import User from '#models/user'
import RefreshToken from '#models/refresh_token'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import UserSessionService from '#services/users/user_session_service'
import type { HttpContext } from '@adonisjs/core/http'
import Mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export interface LoginResult {
    accessToken: any
    refreshToken: string
    user: User
}

export interface PasswordResetResult {
    success: boolean
    message: string
}

export class AuthService {
    /**
     * Authentifie un utilisateur et génère les tokens
     */
    static async login(email: string, password: string, httpContext: HttpContext): Promise<LoginResult> {
        const user = await User.findBy('email', email)

        if (!user || !user.isVerified) {
            throw new Error('Invalid credentials or account not verified.')
        }

        if (user.isBlocked) {
            throw new Error('Your account is blocked. Please contact the administrator.')
        }

        const verifiedUser = await User.verifyCredentials(email, password)

        // Créer le token d'accès
        const auth = httpContext.auth
        const accessToken = await auth.use('api').createToken(verifiedUser)

        // Créer le refresh token
        const refreshToken = crypto.randomBytes(40).toString('hex')
        await RefreshToken.create({
            userId: verifiedUser.id,
            token: refreshToken,
            expiresAt: DateTime.utc().plus({ days: 7 }),
        })

        // Démarrer la session
        await UserSessionService.start(verifiedUser, httpContext)

        return {
            accessToken,
            refreshToken,
            user: verifiedUser,
        }
    }

    /**
     * Déconnecte un utilisateur
     */
    static async logout(user: User, httpContext: HttpContext): Promise<void> {
        const auth = httpContext.auth
        await auth.use('api').invalidateToken()
        await UserSessionService.end(user.id)
    }

    /**
     * Rafraîchit un token d'accès
     */
    static async refreshAccessToken(refreshToken: string, httpContext: HttpContext): Promise<LoginResult> {
        const stored = await RefreshToken.query()
            .where('token', refreshToken)
            .andWhere('is_revoked', false)
            .first()

        if (!stored || stored.expiresAt < DateTime.utc()) {
            throw new Error('Invalid or expired refresh token.')
        }

        const user = await User.find(stored.userId)
        if (!user) {
            throw new Error('User not found.')
        }

        // Révoquer l'ancien refresh token
        stored.isRevoked = true
        await stored.save()

        // Créer un nouveau token d'accès
        const auth = httpContext.auth
        const accessToken = await auth.use('api').createToken(user)

        // Créer un nouveau refresh token
        const newRefreshToken = crypto.randomBytes(40).toString('hex')
        await RefreshToken.create({
            userId: user.id,
            token: newRefreshToken,
            expiresAt: DateTime.utc().plus({ days: 7 }),
        })

        return {
            accessToken,
            refreshToken: newRefreshToken,
            user,
        }
    }

    /**
     * Demande une réinitialisation de mot de passe
     */
    static async requestPasswordReset(email: string): Promise<PasswordResetResult> {
        const user = await User.findBy('email', email)

        if (!user) {
            // Ne pas révéler si l'email existe ou non
            return {
                success: true,
                message: 'If an account exists, a reset link has been sent.',
            }
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

        return {
            success: true,
            message: 'Password reset link sent to your email.',
        }
    }

    /**
     * Vérifie si un token de réinitialisation est valide
     */
    static async verifyResetToken(token: string): Promise<boolean> {
        const hashed = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.query()
            .where('reset_token', hashed)
            .andWhere('reset_expires', '>', DateTime.utc().toSQL())
            .first()

        return !!user
    }

    /**
     * Réinitialise le mot de passe
     */
    static async resetPassword(token: string, newPassword: string): Promise<void> {
        const hashed = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.query()
            .where('reset_token', hashed)
            .andWhere('reset_expires', '>', DateTime.utc().toSQL())
            .first()

        if (!user) {
            throw new Error('Invalid or expired password reset link.')
        }

        user.password = newPassword
        user.resetToken = null
        user.resetExpires = null
        await user.save()

        await UserSessionService.end(user.id)
    }

    /**
     * Définit le mot de passe initial
     */
    static async setPassword(token: string, newPassword: string): Promise<void> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.query()
            .where('verify_token', hashedToken)
            .where('verify_expires', '>', DateTime.utc().toSQL())
            .first()

        if (!user) {
            throw new Error('Invalid or expired link.')
        }

        user.password = newPassword
        user.isVerified = true
        user.verifyToken = null
        user.verifyExpires = null
        await user.save()
    }

    /**
     * Récupère l'utilisateur authentifié
     */
    static async getAuthenticatedUser(httpContext: HttpContext): Promise<User> {
        const auth = httpContext.auth
        const user = await auth.use('api').authenticate()

        if (!user) {
            throw new Error('Not authenticated')
        }

        if (user.isBlocked) {
            throw new Error('Your account is blocked. Please contact the administrator.')
        }

        return user
    }
}

