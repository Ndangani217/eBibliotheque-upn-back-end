/*
|--------------------------------------------------------------------------
| Routes File — Backend eBibliothèque UPN
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { namedMiddleware } from './kernel.js'

/* ==========================================================================
   AUTHENTIFICATION
   ========================================================================== */
const AuthController = () => import('#controllers/auth_controller')

router
    .group(() => {
        router.post('/login', [AuthController, 'storeSession'])
        router.delete('/logout', [AuthController, 'destroySession'])
        router.get('/me', [AuthController, 'showAuthenticatedUser'])
        router.post('/refresh', [AuthController, 'refreshToken'])
        router.post('/forgot-password', [AuthController, 'requestPasswordReset'])
        router.get('/reset-password/:token', [AuthController, 'verifyResetToken'])
        router.post('/reset-password/:token', [AuthController, 'resetPassword'])
        router.post('/set-password/:token', [AuthController, 'setPassword'])
    })
    .prefix('/auth')

/* ==========================================================================
   MAINTENANCE
   ========================================================================== */
const SubscriptionCardsController = () => import('#controllers/subscription_cards_controller')
const PaymentVouchersController = () => import('#controllers/payment_vouchers_controller')
router.patch('/maintenance/cards/expire', [SubscriptionCardsController, 'checkExpiredCards'])
router.patch('/maintenance/vouchers/expire', [PaymentVouchersController, 'expireVouchers'])

/* ==========================================================================
   MANAGER DASHBOARD & ADMINISTRATION
   ========================================================================== */
const ManagerController = () => import('#controllers/managers_controller')
const ActivityLogsController = () => import('#controllers/activity_logs_controller')

router
    .group(() => {
        router.get('/dashboard', [ManagerController, 'dashboard'])
        router.get('/payments', [ManagerController, 'payments'])
        router.patch('/payments/:id/validate', [PaymentVouchersController, 'validatePayment'])
        router.get('/payments/export', [ManagerController, 'exportPayments'])
        router.get('/subscriptions', [ManagerController, 'subscriptions'])
        router.patch('/subscriptions/:id/suspend', [ManagerController, 'suspendCard'])
        router.get('/subscriptions/:id/print-card', [ManagerController, 'printCardBySubscription'])
        router.get('/subscriptions/active/export', [ManagerController, 'exportActiveSubscriptions'])
        router.get('/subscriptions/expired/export', [
            ManagerController,
            'exportExpiredSubscriptions',
        ])
        router.get('/cards', [ManagerController, 'cards'])
        router.patch('/cards/:id/activate', [ManagerController, 'activateCard'])
        router.patch('/cards/:id/suspend', [ManagerController, 'suspendCard'])
        router.get('/cards/:id/print', [ManagerController, 'printCard'])
        router.get('/subscriptions/expiring-soon', [ManagerController, 'expiringSoon'])
        router.get('/users', [ManagerController, 'subscribers'])
        router.post('/users/:id/send-password-reset', [ManagerController, 'sendPasswordResetLink'])
        router.get('/activity-logs', [ActivityLogsController, 'index']).use(namedMiddleware.auth())
    })
    .prefix('/manager')

/* ==========================================================================
   PAIEMENTS
   ========================================================================== */
router
    .group(() => {
        router.post('/vouchers/generate', [PaymentVouchersController, 'generateVoucher']).use(namedMiddleware.auth())
        router.get('/vouchers/active', [PaymentVouchersController, 'getActiveVoucher']).use(namedMiddleware.auth())
        router.get('/vouchers/:id/download', [PaymentVouchersController, 'downloadVoucher']).use(namedMiddleware.auth())
        router.get('/cards/active', [SubscriptionCardsController, 'getActiveCard']).use(namedMiddleware.auth())
        router.get('/cards/generate/:id', [SubscriptionCardsController, 'generateCard']).use(namedMiddleware.auth())
        router.patch('/cards/:id/activate', [SubscriptionCardsController, 'activateCard']).use(namedMiddleware.auth())
    })
    .prefix('/payments')

// Route publique pour la vérification QR
router.get('/payments/cards/verify/:code', [SubscriptionCardsController, 'verify'])

/* ==========================================================================
   UTILISATEURS
   ========================================================================== */
const UserController = () => import('#controllers/users_controller')

router
    .group(() => {
        router.get('/', [UserController, 'index']).use(namedMiddleware.auth())
        router.post('/register-subscriber', [UserController, 'registerSubscriber'])
        router.get('/unverified', [UserController, 'unverified']).use(namedMiddleware.auth())
        router.get('/:id', [UserController, 'show']).use(namedMiddleware.auth())
        router.post('/', [UserController, 'store'])
        router.put('/:id', [UserController, 'update']).use(namedMiddleware.auth())
        router.patch('/:id/block', [UserController, 'block']).use(namedMiddleware.auth())
        router.patch('/:id/unblock', [UserController, 'unblock']).use(namedMiddleware.auth())
        router.delete('/:id', [UserController, 'destroy'])
        router.get('/stats/global', [UserController, 'stats']).use(namedMiddleware.auth())
    })
    .prefix('/users')
