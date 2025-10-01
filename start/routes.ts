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
import { namedMiddleware as middleware } from './kernel.js'
const UsersController = () => import('#controllers/users_controller')
const RoomsController = () => import('#controllers/rooms_controller')
const ReservationsController = () => import('#controllers/reservations_controller')
const PaymentsController = () => import('#controllers/payments_controller')
const ConductsController = () => import('#controllers/conducts_controller')
const SubscriptionsController = () => import('#controllers/subscriptions_controller')
import { DateTime } from 'luxon'

import { Role } from '#types/role'
router
    .group(() => {
        // -------------------------
        // STUDENTS
        // -------------------------
        router
            .get('/students/search', [UsersController, 'searchStudents'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/students', [UsersController, 'getStudents'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/students/:id', [UsersController, 'getStudentById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router.post('/students', [UsersController, 'createStudent'])

        router
            .put('/students/:id', [UsersController, 'updateStudent'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.STUDENT, Role.ADMIN, Role.MANAGER]),
            ])

        router
            .delete('/students/:id', [UsersController, 'deleteStudent'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        // -------------------------
        // ADMINS
        // -------------------------
        router
            .get('/admins', [UsersController, 'getAdmins'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .get('/admins/:id', [UsersController, 'getAdminById'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .post('/admins', [UsersController, 'createAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .put('/admins/:id', [UsersController, 'updateAdmin'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

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

        router
            .get('/managers/:id', [UsersController, 'getManagerById'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        router
            .post('/managers', [UsersController, 'createManager'])
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
        router.post('/reset-password/:token', [UsersController, 'resetPassword'])

        // -------------------------
        // AUTH
        // -------------------------
        router.get('/me', [UsersController, 'me']).middleware([middleware.auth()])
        router.post('/login', [UsersController, 'login'])
        router.post('/logout', [UsersController, 'logout']).middleware([middleware.auth()])

        // Dans /users
        router
            .get('/:id/sessions/day', [UsersController, 'sessionsOfDay'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .post('/heartbeat', async ({ auth, response }) => {
                if (!auth.user) {
                    return response.unauthorized({ status: 'error', message: 'Non authentifié' })
                }
                auth.user.lastSeenAt = DateTime.now()
                await auth.user.save()
                return response.ok({ status: 'success', message: 'Heartbeat enregistré' })
            })
            .middleware([middleware.auth()])
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
        router
            .get('/', [PaymentsController, 'getAllPayments'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .get('/:id', [PaymentsController, 'getById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .post('/', [PaymentsController, 'create'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .put('/:id', [PaymentsController, 'update'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        router
            .delete('/:id', [PaymentsController, 'destroy'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/subscriptions/:id/payments', [PaymentsController, 'bySubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/subscriptions/:id/payments/total', [PaymentsController, 'totalBySubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .patch('/:id/status', [PaymentsController, 'updateStatus'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/reference/:reference', [PaymentsController, 'searchByReference'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/students/:studentId/payments/period', [PaymentsController, 'byStudentPeriod'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/students/:studentId/payments/summary', [
                PaymentsController,
                'summaryByStudentPeriod',
            ])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        router
            .get('/dashboard', [PaymentsController, 'dashboard'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])
    })
    .prefix('/payments')

router
    .group(() => {
        router.get('/', [ConductsController, 'index']).use(middleware.auth())
        router.get('/:id', [ConductsController, 'show']).use(middleware.auth())
        router.post('/', [ConductsController, 'store']).use([middleware.auth()])
        router.put('/:id', [ConductsController, 'update']).use([middleware.auth()])
        router.delete('/:id', [ConductsController, 'destroy']).use([middleware.auth()])

        router.get('/student/:studentId', [ConductsController, 'byStudent']).use(middleware.auth())
        router
            .get('/student/:studentId/stats', [ConductsController, 'statsByStudent'])
            .use(middleware.auth())

        router.get('/status', [ConductsController, 'byStatus']).use(middleware.auth())
        router.put('/:id/close', [ConductsController, 'close']).use(middleware.auth())
    })
    .prefix('/conducts')

router
    .group(() => {
        //  Liste de tous les abonnements
        router
            .get('/', [SubscriptionsController, 'getAllSubscriptions'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        // Détails d’un abonnement
        router
            .get('/:id', [SubscriptionsController, 'getByIdSubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        // Créer un abonnement
        router
            .post('/', [SubscriptionsController, 'create'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        // Mettre à jour un abonnement
        router
            .put('/:id', [SubscriptionsController, 'update'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        // Supprimer un abonnement
        router
            .delete('/:id', [SubscriptionsController, 'delete'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN])])

        // Récupérer les paiements d’un abonnement
        router
            .get('/:id/payments', [SubscriptionsController, 'payments'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])

        // Abonnements expirant dans une période
        router
            .get('/expiring/list', [SubscriptionsController, 'expiring'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        // Abonnements par statut
        router
            .get('/status/list', [SubscriptionsController, 'byStatus'])
            .middleware([middleware.auth(), middleware.hasRole([Role.ADMIN, Role.MANAGER])])

        // Temps restant d’un abonnement
        router
            .get('/:id/remaining', [SubscriptionsController, 'remainingTime'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
            ])
    })
    .prefix('/subscriptions')
