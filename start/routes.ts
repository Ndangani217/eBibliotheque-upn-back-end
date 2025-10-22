/*
|--------------------------------------------------------------------------
| Routes File
|--------------------------------------------------------------------------
|
| This file is used to define all HTTP routes of the application.
|
*/

import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/users_controller')
const PaymentVouchersController = () => import('#controllers/payment_vouchers_controller')
/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/
router
    .group(() => {
        router.post('/login', [AuthController, 'storeSession'])
        router.delete('/logout', [AuthController, 'destroySession'])

        router.get('/me', [AuthController, 'showAuthenticatedUser'])
        //.middleware([middleware.auth())

        router.post('/refresh', [AuthController, 'refreshToken'])
        router.post('/forgot-password', [AuthController, 'requestPasswordReset'])
        router.post('/reset-password/:token', [AuthController, 'resetPassword'])
        router.post('/set-password/:token', [AuthController, 'setPassword'])
    })
    .prefix('/auth')

router
    .group(() => {
        //router.post('/subscribers', [UserController, 'createSubscriber'])
        router.get('/', [UserController, 'index'])
        router.post('/register-subscriber', [UserController, 'registerSubscriber'])
        router.get('/unverified', [UserController, 'unverified'])
        router.get('/:id', [UserController, 'show'])
        router.post('/', [UserController, 'store'])
        router.put('/:id', [UserController, 'update'])
        router.patch('/:id/block', [UserController, 'block'])
        router.patch('/:id/unblock', [UserController, 'unblock'])
        router.delete('/:id', [UserController, 'destroy'])
        //router.get('/:id/sessions', [UserController, 'sessions'])
        router.get('/stats/global', [UserController, 'stats'])
        //router.patch('/:id/promote', [UserController, 'promote'])
    })
    .prefix('/users')

import SubscriptionCardsController from '#controllers/subscription_cards_controller'

// Regroupe toutes les routes liées aux paiements et abonnements
router
    .group(() => {
        // Générer un bon de paiement (PDF)
        router.post('/vouchers', [PaymentVouchersController, 'generateVoucher'])
        // Valider un paiement (après confirmation bancaire)
        router.post('/vouchers/:id/validate', [PaymentVouchersController, 'validatePayment'])
        // Générer le reçu PDF du paiement
        router.get('/vouchers/:id/receipt', [PaymentVouchersController, 'generateReceipt'])
        // Liste paginée des bons de paiement de l’utilisateur connecté
        router.get('/vouchers', [PaymentVouchersController, 'index'])
        // Afficher un bon précis (détail)
        router.get('/vouchers/:id', [PaymentVouchersController, 'show'])

        // Supprimer un bon non payé (admin / test)
        router.delete('/vouchers/:id', [PaymentVouchersController, 'delete'])

        // Réinitialiser le statut d’un bon
        router.patch('/vouchers/:id/reset', [PaymentVouchersController, 'resetStatus'])

        // Générer manuellement une carte (PDF + QR)
        router.post('/cards/:id/generate', [SubscriptionCardsController, 'generateCard'])

        // Vérification publique via QR (utilisée par Next.js)
        router.get('/cards/verify/:code', [SubscriptionCardsController, 'verify'])

        router.group(() => {
            router.get('/subscription-types/:category', [
                PaymentVouchersController,
                'listByCategory',
            ])
        })
    })
    .prefix('/payments')
