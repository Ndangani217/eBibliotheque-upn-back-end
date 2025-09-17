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
const RoomsController = () => import('#controllers/rooms_controller')
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
            .get('/students/search', [UsersController, 'searchStudents'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .get('/admins', [UsersController, 'getAdmins'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router.get('/admins/:id', [UsersController, 'getAdminById'])

        router
            .post('/admins', [UsersController, 'createAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router.post('/:id/password', [UsersController, 'addPassword'])

        router
            .put('/admins/:id', [UsersController, 'updateAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .delete('/admins/:id', [UsersController, 'deleteAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .get('/managers/search', [UsersController, 'searchManagers'])
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

router
    .group(() => {
        // Routes Chambres
        router
            .post('/rooms', [RoomsController, 'createRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.MANAGER])])
        router
            .get('/rooms', [RoomsController, 'getRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .get('/rooms/:id', [RoomsController, 'getRoomById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])
        router
            .put('/rooms/:id', [RoomsController, 'updateRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .delete('/rooms/:id', [RoomsController, 'deleteRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .post('/rooms/:id/assign-student', [RoomsController, 'assignRoomStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .post('/rooms/:id/remove-student', [RoomsController, 'removeRoomStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .get('/rooms/:id/students', [RoomsController, 'getRoomStudents'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])
        router
            .post('/rooms/:id/transfer-student', [RoomsController, 'transferStudentRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .get('/rooms/available', [RoomsController, 'getAvailableRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .get('/rooms/occupied', [RoomsController, 'getOccupiedRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .patch('/rooms/:id/status', [RoomsController, 'updateRoomStatus'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/rooms/:id/capacity', [RoomsController, 'getRoomCapacityInfo'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .post('/rooms/:id/clear', [RoomsController, 'clearRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .get('/rooms/search', [RoomsController, 'searchRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
    })
    .prefix('/rooms')
