import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
    public async handle(ctx: HttpContext, next: NextFn, options: { guards?: 'api'[] } = {}) {
        try {
            await ctx.auth.authenticateUsing(options.guards ?? ['api'])
            return await next()
        } catch {
            return ctx.response.unauthorized({
                status: 'error',
                message: 'Accès refusé : token manquant, expiré ou invalide.',
            })
        }
    }
}
