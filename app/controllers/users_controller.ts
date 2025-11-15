import type { HttpContext } from '@adonisjs/core/http'
import { handleError } from '#helpers/handle_error'
import { ApiResponseHelper } from '#helpers/api_response'
import { UserService } from '#services/users/user_service'
import {
    CreateUserValidator,
    UpdateUserValidator,
    RegisterSubscriberValidator,
} from '#validators/user'
import { UserRole } from '#enums/library_enums'

export default class UserController {
    /** Liste des utilisateurs vérifiés */
    async index({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = (request.input('search', '') as string).trim()

            const users = await UserService.listUsers({
                page,
                limit,
                search,
                roles: [UserRole.MANAGER, UserRole.MANAGER_VIEWER],
                verified: true,
            })

            const sanitized = users.serialize({
                fields: {
                    omit: ['password', 'verifyToken', 'verifyExpires'],
                },
            })

            return ApiResponseHelper.success(
                response,
                sanitized,
                'Liste des managers et managers (vue)',
                users.getMeta(),
            )
        } catch (error) {
            console.error('Erreur index UsersController:', error)
            return handleError(response, error, 'Impossible de récupérer la liste des managers')
        }
    }

    /** Liste des utilisateurs non vérifiés */
    async unverified({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = (request.input('search', '') as string).trim()

            const users = await UserService.listUsers({
                page,
                limit,
                search,
                verified: false,
            })

            return ApiResponseHelper.success(
                response,
                users,
                'List of unverified users',
                users.getMeta(),
            )
        } catch (error) {
            return handleError(response, error, 'Unable to retrieve unverified accounts')
        }
    }

    /** Détails d'un utilisateur */
    async show({ params, response }: HttpContext) {
        try {
            const user = await UserService.getUserById(params.id)

            return ApiResponseHelper.success(response, user, 'User retrieved successfully')
        } catch (error: any) {
            if (error.message === 'User not found') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            return handleError(response, error, 'Unable to display user profile')
        }
    }

    /** Création d'un utilisateur (admin) */
    async store({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(CreateUserValidator)
            await UserService.createUser(payload)

            return ApiResponseHelper.created(
                response,
                null,
                'Subscriber created. Please check your email to set your password.',
            )
        } catch (error: any) {
            if (error.message === 'A user with this email or phone number already exists.') {
                return ApiResponseHelper.error(response, error.message, 400)
            }
            return handleError(response, error, 'Unable to create user')
        }
    }

    /** Inscription d'un abonné (citoyen ou chercheur) */
    async registerSubscriber({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(RegisterSubscriberValidator)
            await UserService.registerSubscriber(payload)

            return ApiResponseHelper.created(
                response,
                null,
                'Subscriber created. Please check your email to set your password.',
            )
        } catch (error: any) {
            if (error.message === 'A user with this email or phone number already exists.') {
                return ApiResponseHelper.error(response, error.message, 400)
            }
            return handleError(response, error, 'Unable to register subscriber')
        }
    }

    /** Mise à jour d'un utilisateur */
    async update({ params, request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(UpdateUserValidator)
            const user = await UserService.updateUser(params.id, payload)

            return ApiResponseHelper.success(response, user, 'User profile updated successfully')
        } catch (error: any) {
            if (error.message === 'User not found') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            return handleError(response, error, 'Unable to update user')
        }
    }

    /** Blocage et déblocage d'utilisateur */
    async block({ params, response }: HttpContext) {
        try {
            const user = await UserService.blockUser(params.id)

            return ApiResponseHelper.success(
                response,
                { id: user.id, isBlocked: true },
                'User blocked successfully',
            )
        } catch (error: any) {
            if (error.message === 'User not found') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            if (error.message === 'This user is already blocked.') {
                return ApiResponseHelper.success(response, null, error.message)
            }
            return handleError(response, error, 'Unable to block user')
        }
    }

    async unblock({ params, response }: HttpContext) {
        try {
            const user = await UserService.unblockUser(params.id)

            return ApiResponseHelper.success(
                response,
                { id: user.id, isBlocked: user.isBlocked },
                'User unblocked successfully',
            )
        } catch (error: any) {
            if (error.message === 'User not found') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            return handleError(response, error, 'Unable to unblock user')
        }
    }

    /** Suppression d'un utilisateur */
    async destroy({ params, response }: HttpContext) {
        try {
            await UserService.deleteUser(params.id)

            return ApiResponseHelper.success(response, null, 'User deleted successfully')
        } catch (error: any) {
            if (error.message === 'User not found') {
                return ApiResponseHelper.notFound(response, error.message)
            }
            return handleError(response, error, 'Unable to delete user')
        }
    }

    /** Statistiques utilisateurs */
    async stats({ response }: HttpContext) {
        try {
            const stats = await UserService.getUserStats()

            return ApiResponseHelper.success(
                response,
                stats,
                'User statistics retrieved successfully',
            )
        } catch (error) {
            return handleError(response, error, 'Unable to retrieve user statistics')
        }
    }
}
