/*
|--------------------------------------------------------------------------
| Routes File — Backend eBibliothèque UPN
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { namedMiddleware as middleware } from './kernel.js'

/* ------------------------------
 * Contrôleurs
 * ------------------------------ */
const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/users_controller')
const PaymentVouchersController = () => import('#controllers/payment_vouchers_controller')
const SubscriptionCardsController = () => import('#controllers/subscription_cards_controller')
const ManagerController = () => import('#controllers/managers_controller')

/* ------------------------------
 * AUTHENTIFICATION
 * ------------------------------ */
router
    .group(() => {
        router.post('/login', [AuthController, 'storeSession'])
        router.delete('/logout', [AuthController, 'destroySession'])
        router.get('/me', [AuthController, 'showAuthenticatedUser']).use(middleware.auth())
        router.post('/refresh', [AuthController, 'refreshToken'])
        router.post('/forgot-password', [AuthController, 'requestPasswordReset'])
        router.post('/reset-password/:token', [AuthController, 'resetPassword'])
        router.post('/set-password/:token', [AuthController, 'setPassword'])
    })
    .prefix('/auth')

/* ------------------------------
 * UTILISATEURS
 * ------------------------------ */
router
    .group(() => {
        router.get('/', [UserController, 'index']).use(middleware.auth())
        router.post('/register-subscriber', [UserController, 'registerSubscriber'])
        router.get('/unverified', [UserController, 'unverified']).use(middleware.auth())
        router.get('/:id', [UserController, 'show']).use(middleware.auth())
        router.post('/', [UserController, 'store'])
        router.put('/:id', [UserController, 'update']).use(middleware.auth())
        router.patch('/:id/block', [UserController, 'block']).use(middleware.auth())
        router.patch('/:id/unblock', [UserController, 'unblock']).use(middleware.auth())
        router.delete('/:id', [UserController, 'destroy'])
        router.get('/stats/global', [UserController, 'stats']).use(middleware.auth())
    })
    .prefix('/users')

/* ------------------------------
 * PAIEMENTS (Bon, reçu, carte)
 * ------------------------------ */
router
    .group(() => {
        // Bons de paiement
        router.post('/vouchers/generate', [PaymentVouchersController, 'generateVoucher'])
        //router.get('/vouchers', [PaymentVouchersController, 'index'])
        //router.post('/vouchers/:id/validate', [PaymentVouchersController, 'validatePayment'])
        //router.get('/vouchers/:id/receipt', [PaymentVouchersController, 'generateReceipt'])

        //Carte d’abonnement
        router.get('/cards/active', [SubscriptionCardsController, 'getActiveCard'])
        router.get('/cards/generate/:id', [SubscriptionCardsController, 'generateCard'])
        router.patch('/cards/:id/activate', [SubscriptionCardsController, 'activateCard'])
    })
    .prefix('/payments')
    .use(middleware.auth())

// Route publique pour la vérification QR
router.get('/payments/cards/verify/:code', [SubscriptionCardsController, 'verify'])

// Route publique pour les formules
//router.get('/payments/subscription-types/:category', [PaymentVouchersController, 'listByCategory'])
router
    .group(() => {
        router.get('/dashboard', [ManagerController, 'dashboard'])
        router.get('/payments', [ManagerController, 'payments'])
        router.patch('/payments/:id/validate', [PaymentVouchersController, 'validatePayment'])
        router.get('/subscriptions', [ManagerController, 'subscriptions'])
        router.patch('/subscriptions/:id/suspend', [ManagerController, 'suspendCard'])
        router.get('/cards', [ManagerController, 'cards'])
        router.patch('/cards/:id/activate', [ManagerController, 'activateCard'])
        router.patch('/cards/:id/suspend', [ManagerController, 'suspendCard'])
        router.get('/cards/:id/print', [ManagerController, 'printCard'])
        router.get('/subscriptions/expiring-soon', [ManagerController, 'expiringSoon'])
    })
    .prefix('/manager')
    .use(middleware.auth())

router.patch('/maintenance/cards/expire', [SubscriptionCardsController, 'checkExpiredCards'])

196 - 169 - 606
