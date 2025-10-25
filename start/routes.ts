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
        router.post('/vouchers/:id/validate', [PaymentVouchersController, 'validatePayment'])
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
