// app/services/user_session_service.ts
import { DateTime } from 'luxon'
import User from '#models/user'
import UserSession from '#models/user_session'
import type { HttpContext } from '@adonisjs/core/http'

class UserSessionService {
    /** Démarre une session (login) */
    async start(user: User, ctx: HttpContext) {
        const ip = ctx.request.ip()
        const userAgent = ctx.request.header('user-agent') ?? null

        // Option : fermer toute session restée "ouverte" (logout_at null)
        await UserSession.query()
            .where('user_id', user.id)
            .whereNull('logout_at')
            .update({ logoutAt: DateTime.now() })

        return await UserSession.create({
            userId: user.id,
            loginAt: DateTime.now(),
            logoutAt: null,
            ip,
            userAgent,
        })
    }

    /** Termine la session en cours (logout) */
    async end(userId: number) {
        const open = await UserSession.query()
            .where('user_id', userId)
            .whereNull('logout_at')
            .orderBy('login_at', 'desc')
            .first()

        if (open) {
            open.logoutAt = DateTime.now()
            await open.save()
        }
    }

    /** Renvoie true si au moins une session ouverte */
    async isOnline(userId: number) {
        const count = await UserSession.query()
            .where('user_id', userId)
            .whereNull('logout_at')
            .count('* as total')

        return Number(count[0].$extras.total ?? 0) > 0
    }

    /** Dernière session (pour dernier horaire) */
    public async lastSession(userId: number) {
        return await UserSession.query()
            .where('user_id', userId)
            .orderBy('login_at', 'desc')
            .first()
    }
}
export default new UserSessionService()
