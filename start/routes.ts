/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file est utilisé pour définir toutes les routes HTTP.
|
*/

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

// -------------------------
// PAYMENTS
// -------------------------
router
    .group(() => {
        // Dashboard global
        router
            .get('/dashboard', [PaymentsController, 'dashboard'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // 🔍 Recherche par référence bancaire
        router
            .get('/reference/:reference', [PaymentsController, 'searchByReference'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Paiements d’un abonnement
        router
            .get('/subscriptions/:id/payments', [PaymentsController, 'bySubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Total des paiements d’un abonnement
        router
            .get('/subscriptions/:id/payments/total', [PaymentsController, 'totalBySubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        //Paiements d’un étudiant par période
        router
            .get('/students/:studentId/payments/period', [PaymentsController, 'byStudentPeriod'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        //Résumé des paiements par période
        router
            .get('/students/:studentId/payments/summary', [
                PaymentsController,
                'summaryByStudentPeriod',
            ])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Liste générale
        router
            .get('/', [PaymentsController, 'getAllPayments'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        //Création d’un paiement
        router
            .post('/', [PaymentsController, 'create'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.STUDENT, Role.MANAGER, Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        // 🔎 Détails d’un paiement
        router
            .get('/:id', [PaymentsController, 'getById'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Mise à jour
        router
            .put('/:id', [PaymentsController, 'update'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        //Changement de statut
        router
            .patch('/:id/status', [PaymentsController, 'updateStatus'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Suppression d’un paiement
        router
            .delete('/:id', [PaymentsController, 'destroy'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])
    })
    .prefix('/payments')

// -------------------------
// CONDUCTS
// -------------------------
router
    .group(() => {
        router
            .get('/', [ConductsController, 'index'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .get('/:id', [ConductsController, 'show'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .post('/', [ConductsController, 'store'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .put('/:id', [ConductsController, 'update'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .delete('/:id', [ConductsController, 'destroy'])
            .middleware([middleware.auth(), middleware.checkBlocked()])

        router
            .get('/student/:studentId', [ConductsController, 'byStudent'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .get('/student/:studentId/stats', [ConductsController, 'statsByStudent'])
            .middleware([middleware.auth(), middleware.checkBlocked()])

        router
            .get('/status', [ConductsController, 'byStatus'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
        router
            .put('/:id/close', [ConductsController, 'close'])
            .middleware([middleware.auth(), middleware.checkBlocked()])
    })
    .prefix('/conducts')

// -------------------------
// SUBSCRIPTIONS
// -------------------------

router
    .group(() => {
        // Récupérer tous les abonnements
        router
            .get('/', [SubscriptionsController, 'getAllSubscriptions'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Récupérer un abonnement par ID
        router
            .get('/:id', [SubscriptionsController, 'getByIdSubscription'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Créer un abonnement
        router
            .post('/', [SubscriptionsController, 'create'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Mettre à jour un abonnement
        router
            .put('/:id', [SubscriptionsController, 'update'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Supprimer un abonnement
        router
            .delete('/:id', [SubscriptionsController, 'delete'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN]),
                middleware.checkBlocked(),
            ])

        // Récupérer les paiements liés à un abonnement
        router
            .get('/:id/payments', [SubscriptionsController, 'payments'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])

        // Récupérer les abonnements expirant dans une période (day, week, month, year)
        router
            .get('/expiring/list', [SubscriptionsController, 'expiring'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Récupérer les abonnements par statut
        router
            .get('/status/list', [SubscriptionsController, 'byStatus'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER]),
                middleware.checkBlocked(),
            ])

        // Calculer le temps restant d’un abonnement
        router
            .get('/:id/remaining', [SubscriptionsController, 'remainingTime'])
            .middleware([
                middleware.auth(),
                middleware.hasRole([Role.ADMIN, Role.MANAGER, Role.STUDENT]),
                middleware.checkBlocked(),
            ])
    })
    .prefix('/subscriptions')

const TestMailController = () => import('#controllers/test_mails_controller')
router.get('/test-mail', [TestMailController, 'send'])
