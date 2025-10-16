/*
|--------------------------------------------------------------------------
| HTTP kernel
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * Gestionnaire global des erreurs
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * ✅ Middleware appliqués à TOUTES les requêtes,
 * même sans route correspondante (pré-vol, favicon, etc.)
 */
server.use([
    () => import('#middleware/container_bindings_middleware'),
    () => import('#middleware/force_json_response_middleware'),
    () => import('@adonisjs/cors/cors_middleware'), // CORS global
])

/**
 * ✅ Middleware appliqués à toutes les routes déclarées
 */
router.use([
    () => import('@adonisjs/core/bodyparser_middleware'), // 💥 indispensable pour lire le JSON
    () => import('@adonisjs/auth/initialize_auth_middleware'),
    // () => import('#middleware/initialize_bouncer_middleware'),
])

/**
 * ✅ Middleware nommés (utilisables dans .middleware([...]) sur une route spécifique)
 */
/*export const namedMiddleware = router.named({
    heartbeat: () => import('#middleware/heartbeat_middleware'),
})*/
