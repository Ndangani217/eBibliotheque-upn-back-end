import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Role } from '../types/role/index.js'

export default class HasRoleMiddleware {
    async handle(ctx: HttpContext, next: NextFn, roles: string[]) {
        /**
         * Middleware logic goes here (before the next call)
         */
        await ctx.bouncer.authorize('hasRoleAbility', roles as Role[])
        return await next()
    }
}
