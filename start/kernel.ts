/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'
import '#tasks/reservationCron'
import '#tasks/subscriptionCron'

/**
 * Error handler
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * Middleware global (toujours exécuté sur toutes les requêtes avec une route)
 */
export const middleware = {
    default: [
        () => import('@adonisjs/core/bodyparser_middleware'),
        () => import('#middleware/heartbeat_middleware'),
    ],
}

/**
 * Middleware nommés (utilisables dans .middleware([...]) sur les routes)
 */
export const namedMiddleware = router.named({
    auth: () => import('#middleware/auth_middleware'),
    hasRole: () => import('#middleware/has_role_middleware'),
    heartbeat: () => import('#middleware/heartbeat_middleware'),
    checkBlocked: () => import('#middleware/check_blocked_middleware'),
})

/**
 * Middleware pour toutes les requêtes, même sans route correspondante
 */
server.use([
    () => import('#middleware/container_bindings_middleware'),
    () => import('#middleware/force_json_response_middleware'),
    () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Middleware appliqués à toutes les routes
 */
router.use([
    () => import('@adonisjs/core/bodyparser_middleware'),
    () => import('@adonisjs/auth/initialize_auth_middleware'),
    () => import('#middleware/initialize_bouncer_middleware'),
])
