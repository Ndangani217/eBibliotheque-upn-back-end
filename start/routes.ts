/*
|--------------------------------------------------------------------------
| Routes File
|--------------------------------------------------------------------------
|
| This file is used to define all HTTP routes of the application.
|
*/

import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/users_controller')

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/
router
    .group(() => {
        router.post('/login', [AuthController, 'storeSession'])
        router.delete('/logout', [AuthController, 'destroySession'])
        router.get('/me', [AuthController, 'showAuthenticatedUser'])

        router.post('/refresh', [AuthController, 'refreshToken'])
        router.post('/forgot-password', [AuthController, 'requestPasswordReset'])
        router.post('/reset-password/:token', [AuthController, 'resetPassword'])
        router.post('/set-password/:token', [AuthController, 'setPassword'])
    })
    .prefix('/auth')

router
    .group(() => {
        //router.post('/subscribers', [UserController, 'createSubscriber'])
        router.get('/', [UserController, 'index'])
        router.post('/register-subscriber', [UserController, 'registerSubscriber'])
        router.get('/unverified', [UserController, 'unverified'])
        router.get('/:id', [UserController, 'show'])
        router.post('/', [UserController, 'store'])
        router.put('/:id', [UserController, 'update'])
        router.patch('/:id/block', [UserController, 'block'])
        router.patch('/:id/unblock', [UserController, 'unblock'])
        router.delete('/:id', [UserController, 'destroy'])
        //router.get('/:id/sessions', [UserController, 'sessions'])
        router.get('/stats/global', [UserController, 'stats'])
        //router.patch('/:id/promote', [UserController, 'promote'])
    })
    .prefix('/users')
