import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

export default class HeartbeatMiddleware {
    public async handle(ctx: HttpContext, next: NextFn) {
        // Vérifier si l’utilisateur est authentifié
        if (ctx.auth?.user) {
            ctx.auth.user.lastSeenAt = DateTime.utc()
            await ctx.auth.user.save()
        }

        // Continuer la requête
        return await next()
    }
}
