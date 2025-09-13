/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { middleware } from './kernel.js'
const UsersController = () => import('#controllers/users_controller')

// ------------------------
// USERS / STUDENTS / ADMINS
// ------------------------

router
    .group(() => {
        // USERS / STUDENTS / ADMINS
        router.get('/students', [UsersController, 'getStudents'])
        router.get('/students/:id', [UsersController, 'getStudentById'])
        router.get('/admins', [UsersController, 'getAdmins'])
        router.get('/admins/:id', [UsersController, 'getAdminById'])

        router.post('/students', [UsersController, 'createStudent'])
        router.post('/admins', [UsersController, 'createAdmin'])

        /*router.put('/students/:id', [UsersController, 'updateStudent'])
        router.put('/admins/:id', [UsersController, 'updateAdmin'])

        router.delete('/students/:id', [UsersController, 'deleteStudent'])
        router.delete('/admins/:id', [UsersController, 'deleteAdmin'])

        // Email verification
        router.get('/verify/:token', [UsersController, 'verifyEmail'])

        // Forgot / Reset password
        router.post('/forgot-password', [UsersController, 'forgotPassword'])
        router.get('/reset-password/:token', [UsersController, 'showResetForm'])
        router.post('/reset-password/:token', [UsersController, 'resetPassword'])

        // Change password pour utilisateur connecté
        router
            .post('/change-password', [UsersController, 'changePassword'])
            .middleware([middleware.auth()])

        // Auth
        router.post('/login', [UsersController, 'login'])
        router.post('/logout', [UsersController, 'logout']).middleware([middleware.auth()])*/
    })
    .prefix('/users')

// Middleware pour sécuriser certaines routes
// .use(middleware.auth()) // tu peux activer ici si tu veux protéger toutes ces routes
