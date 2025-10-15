// app/services/user_session_service.ts
import { DateTime } from 'luxon'
import User from '#models/user'
import UserSession from '#models/user_session'
import type { HttpContext } from '@adonisjs/core/http'

class UserSessionService {
    /**
     * 🔹 Démarre une session (login)
     */
    async start(user: User, ctx: HttpContext) {
        const ip = ctx.request.ip()
        const device = ctx.request.header('user-agent') ?? 'Inconnu'

        // Fermer toute session restée ouverte
        await UserSession.query()
            .where('user_id', user.id)
            .whereNull('logged_out_at')
            .update({ loggedOutAt: DateTime.now(), isActive: false })

        // Créer une nouvelle session
        return await UserSession.create({
            userId: user.id,
            sessionToken: crypto.randomUUID(),
            ipAddress: ip,
            deviceInfo: device,
            loggedInAt: DateTime.now(),
            isActive: true,
        })
    }

    /**
     *  Termine la session en cours (logout)
     */
    async end(userId: string) {
        const open = await UserSession.query()
            .where('user_id', userId)
            .andWhere('is_active', true)
            .orderBy('logged_in_at', 'desc')
            .first()

        if (open) {
            open.isActive = false
            open.loggedOutAt = DateTime.now()
            await open.save()
        }
    }

    /**
     *  Vérifie si l’utilisateur a au moins une session active
     */
    async isOnline(userId: string): Promise<boolean> {
        const count = await UserSession.query()
            .where('user_id', userId)
            .andWhere('is_active', true)
            .count('* as total')

        return Number(count[0].$extras.total ?? 0) > 0
    }

    /**
     *  Récupère la dernière session ouverte (pour afficher le dernier login)
     */
    async lastSession(userId: string) {
        return await UserSession.query()
            .where('user_id', userId)
            .orderBy('logged_in_at', 'desc')
            .first()
    }
}

export default new UserSessionService()
