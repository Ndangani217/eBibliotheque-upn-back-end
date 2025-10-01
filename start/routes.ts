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
const ReservationsController = () => import('#controllers/reservations_controller')
const PaymentsController = () => import('#controllers/payments_controller')

import { Role } from '#types/role'

router
    .group(() => {
        // STUDENTS

        router
            .get('/students/search', [UsersController, 'searchStudents'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
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

        // -------------------------
        // ADMINS
        // -------------------------
        router
            .get('/admins', [UsersController, 'getAdmins'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router.get('/admins/:id', [UsersController, 'getAdminById'])
        router.post('/admins', [UsersController, 'createAdmin'])

        router
            .put('/admins/:id', [UsersController, 'updateAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
        router
            .delete('/admins/:id', [UsersController, 'deleteAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .get('/admins/search', [UsersController, 'searchAdmins'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        // -------------------------
        // MANAGERS
        // -------------------------
        router
            .get('/managers', [UsersController, 'getManagers'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router.get('/managers/:id', [UsersController, 'getManagerById'])
        router
            .post('/manager', [UsersController, 'createManager'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .put('/managers/:id', [UsersController, 'updateManager'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .delete('/managers/:id', [UsersController, 'deleteManager'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])
        router
            .get('/managers/search', [UsersController, 'searchManagers'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        // -------------------------
        // PASSWORD / AUTH
        // -------------------------
        router.post('/:id/password', [UsersController, 'addPassword'])
        router.post('/forgot-password', [UsersController, 'forgotPassword'])

        // -------------------------
        // AUTH
        // -------------------------
        router.get('/me', [UsersController, 'me']).middleware([middleware.auth()])
        router.post('/login', [UsersController, 'login'])
        router.post('/logout', [UsersController, 'logout']).middleware([middleware.auth()])
    })
    .prefix('/users')

router
    .group(() => {
        router
            .get('/available', [RoomsController, 'getAvailableRooms'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/occupied', [RoomsController, 'getOccupiedRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/search', [RoomsController, 'searchRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/create', [RoomsController, 'createRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.MANAGER])])

        router
            .get('/', [RoomsController, 'getRooms'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/:id', [RoomsController, 'getRoomById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .put('/:id', [RoomsController, 'updateRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .delete('/:id', [RoomsController, 'deleteRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/:id/assign-student', [RoomsController, 'assignRoomStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/:id/remove-student', [RoomsController, 'removeRoomStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/:id/students', [RoomsController, 'getRoomStudents'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .post('/:id/transfer-student', [RoomsController, 'transferStudentRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .patch('/:id/status', [RoomsController, 'updateRoomStatus'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/:id/capacity', [RoomsController, 'getRoomCapacityInfo'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/:id/clear', [RoomsController, 'clearRoom'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
    })
    .prefix('/rooms')

// CRUD Réservations
router
    .group(() => {
        router
            .get('/search', [ReservationsController, 'searchByStudentName'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/status', [ReservationsController, 'getByStatus'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/', [ReservationsController, 'create'])
            .middleware([middleware.auth(), middleware.hasRole([Role.STUDENT])])

        router
            .get('/', [ReservationsController, 'getAllReservations'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/my', [ReservationsController, 'getMyReservation'])
            .middleware([middleware.auth(), middleware.hasRole([Role.STUDENT])])

        router
            .get('/:id', [ReservationsController, 'getById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .put('/:id', [ReservationsController, 'update'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .put('/:id/approve', [ReservationsController, 'approve'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .put('/:id/reject', [ReservationsController, 'reject'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .put('/:id/cancel', [ReservationsController, 'cancel'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .delete('/:id', [ReservationsController, 'delete'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])
    })
    .prefix('/reservations')

router
    .group(() => {
        router.get('/payments', [PaymentsController, 'getAllPayments'])

        router.get('/payments/:id', [PaymentsController, 'getById'])

        router.post('/payments', [PaymentsController, 'create'])

        router.put('/payments/:id', [PaymentsController, 'update'])

        router.delete('/payments/:id', [PaymentsController, 'destroy'])

        router.get('/subscriptions/:id/payments', [PaymentsController, 'bySubscription'])

        router.get('/subscriptions/:id/payments/total', [PaymentsController, 'totalBySubscription'])

        router.patch('/payments/:id/status', [PaymentsController, 'updateStatus'])

        router.get('/payments/reference/:reference', [PaymentsController, 'searchByReference'])

        router.get('/students/:studentId/payments/period', [PaymentsController, 'byStudentPeriod'])

        router.get('/students/:studentId/payments/summary', [
            PaymentsController,
            'summaryByStudentPeriod',
        ])
        router.get('/payments/dashboard', [PaymentsController, 'dashboard'])
    })
    .prefix('/api')
