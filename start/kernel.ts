/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| Le fichier Kernel HTTP enregistre les middlewares globaux et
| initialise également les tâches planifiées (cron).
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'
import '#start/cron/cards_and_subscriptions'

/**
 * Gestionnaire d’erreurs HTTP global
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * Middleware appliqués à toutes les requêtes
 */
server.use([
    () => import('#middleware/container_bindings_middleware'),
    () => import('#middleware/force_json_response_middleware'),
    () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Middleware appliqués aux routes avec correspondance
 */
router.use([
    () => import('@adonisjs/core/bodyparser_middleware'),
    () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/**
 * Middleware nommés (pour authentification, rôles, etc.)
 */
export const namedMiddleware = router.named({
    auth: () => import('#middleware/auth_middleware'),
    // hasRole: () => import('#middleware/has_role_middleware'),
    // checkBlocked: () => import('#middleware/check_blocked_middleware'),
})
