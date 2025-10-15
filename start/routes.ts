/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file est utilisé pour définir toutes les routes HTTP.
|
*/

import router from '@adonisjs/core/services/router'
//import { namedMiddleware as middleware } from './kernel.js'*/

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/users_controller')
// -------------------------
// USERS
// -------------------------

router
    .group(() => {
        router.post('/login', [AuthController, 'storeSession'])
        router.delete('/logout', [AuthController, 'destroySession'])
        router.get('/me', [AuthController, 'showAuthenticatedUser'])
        router.post('/activate/:id', [AuthController, 'activateAccount'])
        router.post('/forgot-password', [AuthController, 'requestPasswordReset'])
        router.post('/reset-password/:token', [AuthController, 'resetPassword'])
    })
    .prefix('/auth')
    .as('auth')
router
    .group(() => {
        //  Lister les utilisateurs vérifiés
        router.get('/', [UserController, 'index'])

        //  Lister les utilisateurs non vérifiés
        router.get('/unverified', [UserController, 'unverified'])

        //  Afficher un utilisateur précis (détails)
        router.get('/:id', [UserController, 'show'])

        //  Créer un nouvel utilisateur
        router.post('/', [UserController, 'store'])

        //  Mettre à jour un utilisateur
        router.put('/:id', [UserController, 'update'])

        //  Bloquer un utilisateur
        router.patch('/:id/block', [UserController, 'block'])

        //  Débloquer un utilisateur
        router.patch('/:id/unblock', [UserController, 'unblock'])

        //  Supprimer un utilisateur
        router.delete('/:id', [UserController, 'destroy'])

        //  Historique des sessions d’un utilisateur
        router.get('/:id/sessions', [UserController, 'sessions'])

        // Statistiques globales des utilisateurs
        router.get('/stats/global', [UserController, 'stats'])

        // Changer le rôle d’un utilisateur
        router.patch('/:id/promote', [UserController, 'promote'])
    })
    .prefix('/users')
    .as('users')
