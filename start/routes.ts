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
import { Role } from '../app/types/role/index.js'

// ------------------------
// USERS / STUDENTS / ADMINS
// ------------------------

router
    .group(() => {
        // USERS / STUDENTS / ADMINS
        router
            .get('/students', [UsersController, 'getStudents'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/students/:id', [UsersController, 'getStudentById'])
            .middleware([middleware.auth(), middleware.hasRole([Role.STUDENT])])
        router.post('/students', [UsersController, 'createStudent'])

        router
            .put('/students/:id', [UsersController, 'updateStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.STUDENT])])

        router
            .delete('/students/:id', [UsersController, 'deleteStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .get('/admins', [UsersController, 'getAdmins'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router.get('/admins/:id', [UsersController, 'getAdminById'])

        router
            .post('/admins', [UsersController, 'createAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .put('/admins/:id', [UsersController, 'updateAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .delete('/admins/:id', [UsersController, 'deleteAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        /*
        // Email verification
        router.get('/verify/:token', [UsersController, 'verifyEmail'])

        // Forgot / Reset password
        router.post('/forgot-password', [UsersController, 'forgotPassword'])
        router.get('/reset-password/:token', [UsersController, 'showResetForm'])
        router.post('/reset-password/:token', [UsersController, 'resetPassword'])

        // Change password pour utilisateur connecté
        router
            .post('/change-password', [UsersController, 'changePassword'])
            .middleware([middleware.auth()])*/

        // Auth
        router.post('/login', [UsersController, 'login'])
        router.post('/logout', [UsersController, 'logout']).middleware([middleware.auth()])
    })
    .prefix('/users')

// Middleware pour sécuriser certaines routes
// .use(middleware.auth()) // tu peux activer ici si tu veux protéger toutes ces routes
