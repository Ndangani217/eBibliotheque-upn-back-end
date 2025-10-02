import type { HttpContext } from '@adonisjs/core/http'

export default class CheckBlockedMiddleware {
    async handle({ auth, response }: HttpContext, next: () => Promise<void>) {
        if (auth.user?.isBlocked) {
            return response.forbidden({
                status: 'error',
                message: 'Votre compte est bloqué, contactez l’administration',
            })
        }
        await next()
    }
}
