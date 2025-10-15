/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file est utilisé pour définir toutes les routes HTTP.
|
*/
/*
import router from '@adonisjs/core/services/router'
import { namedMiddleware as middleware } from './kernel.js'

const UsersController = () => import('#controllers/users_controller')
const RoomsController = () => import('#controllers/rooms_controller')
const ReservationsController = () => import('#controllers/reservations_controller')
const PaymentsController = () => import('#controllers/payments_controller')
const ConductsController = () => import('#controllers/conducts_controller')
const SubscriptionsController = () => import('#controllers/subscriptions_controller')

import { DateTime } from 'luxon'
import { Role } from '#types/role'

// -------------------------
// USERS
// -------------------------
router
    .group(() => {
        router.post('/admins', [UsersController, 'createAdmin'])

        // STUDENTS
        router
            .get('/students/search', [UsersController, 'searchStudents'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/students', [UsersController, 'getStudents'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/students/:id', [UsersController, 'getStudentById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router.post('/students', [UsersController, 'createStudent'])

        router
            .put('/students/:id', [UsersController, 'updateStudent'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.STUDENT, Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .delete('/students/:id', [UsersController, 'deleteStudent'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        // ADMINS
        router
            .get('/admins', [UsersController, 'getAdmins'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .get('/admins/:id', [UsersController, 'getAdminById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .put('/admins/:id', [UsersController, 'updateAdmin'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .delete('/admins/:id', [UsersController, 'deleteAdmin'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .get('/admins/search', [UsersController, 'searchAdmins'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        // MANAGERS
        router
            .get('/managers', [UsersController, 'getManagers'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .get('/managers/:id', [UsersController, 'getManagerById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .post('/managers', [UsersController, 'createManager'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .put('/managers/:id', [UsersController, 'updateManager'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .delete('/managers/:id', [UsersController, 'deleteManager'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .get('/managers/search', [UsersController, 'searchManagers'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        router
            .patch('/managers/:id/block', [UsersController, 'block'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .patch('/managers/:id/unblock', [UsersController, 'unblock'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        // PASSWORD & AUTH
        router.post('/:id/add-password', [UsersController, 'addPassword'])
        //router.post('/users/set-password/:token', [UsersController, 'setPasswordAfterActivation'])
        router.post('/forgot-password', [UsersController, 'forgotPassword'])
        router.post('/reset-password/:token', [UsersController, 'resetPassword'])

        router
            .get('/me', [UsersController, 'me'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router.post('/login', [UsersController, 'login'])
        router
            .post('/logout', [UsersController, 'logout'])
            .middleware([middleware.auth(), middleware.checkBlocked()])

        router
            .get('/:id/sessions/day', [UsersController, 'sessionsOfDay'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/heartbeat', async ({ auth, response }) => {
                if (!auth.user) {
                    return response.unauthorized({ status: 'error', message: 'Non authentifié' })
                }
                auth.user.lastSeenAt = DateTime.now()
                await auth.user.save()
                return response.ok({ status: 'success', message: 'Heartbeat enregistré' })
            })
            .middleware([middleware.auth(), middleware.checkBlocked()])
    })
    .prefix('/users')

// -------------------------
// ROOMS
// -------------------------
router
    .group(() => {
        router
            .get('/available', [RoomsController, 'getAvailableRooms'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .get('/occupied', [RoomsController, 'getOccupiedRooms'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/search', [RoomsController, 'searchRooms'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/create', [RoomsController, 'createRoom'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/', [RoomsController, 'getRooms'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/:id', [RoomsController, 'getRoomById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .put('/:id', [RoomsController, 'updateRoom'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .delete('/:id', [RoomsController, 'deleteRoom'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/:id/assign-student', [RoomsController, 'assignRoomStudent'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/:id/remove-student', [RoomsController, 'removeRoomStudent'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/:id/students', [RoomsController, 'getRoomStudents'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .post('/:id/transfer-student', [RoomsController, 'transferStudentRoom'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .patch('/:id/status', [RoomsController, 'updateRoomStatus'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/:id/capacity', [RoomsController, 'getRoomCapacityInfo'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/:id/clear', [RoomsController, 'clearRoom'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])
    })
    .prefix('/rooms')
// -------------------------
// RESERVATIONS
// -------------------------
router
    .group(() => {
        router
            .get('/search', [ReservationsController, 'searchByStudentName'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/status', [ReservationsController, 'getByStatus'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .get('/', [ReservationsController, 'getAllReservations'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .post('/', [ReservationsController, 'create'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .get('/my', [ReservationsController, 'getMyReservation'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .get('/:id', [ReservationsController, 'getById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .put('/:id', [ReservationsController, 'update'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .put('/:id/approve', [ReservationsController, 'approve'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .put('/:id/reject', [ReservationsController, 'reject'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        router
            .put('/:id/cancel', [ReservationsController, 'cancel'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        router
            .delete('/:id', [ReservationsController, 'delete'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])
    })
    .prefix('/reservations')

*/
