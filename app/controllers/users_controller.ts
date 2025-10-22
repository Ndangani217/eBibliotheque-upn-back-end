import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { handleError } from '#helpers/handle_error'
import {
    CreateUserValidator,
    UpdateUserValidator,
    RegisterSubscriberValidator,
} from '#validators/user'
import { UserRole } from '#enums/library_enums'
import UserSessionService from '#services/user_session'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import Mail from '@adonisjs/mail/services/main'

export default class UserController {
    /** Liste des utilisateurs vérifiés */
    async index({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = (request.input('search', '') as string).trim().toLowerCase()

            const users = await User.query()
                .where('is_verified', true)
                .if(search !== '', (query) => {
                    query
                        .whereILike('name', `%${search}%`)
                        .orWhereILike('last_name', `%${search}%`)
                        .orWhereILike('first_name', `%${search}%`)
                        .orWhereILike('email', `%${search}%`)
                        .orWhereILike('phone_number', `%${search}%`)
                })
                .orderBy('created_at', 'desc')
                .paginate(page, limit)

            return response.ok({
                status: 'success',
                message: 'List of verified users',
                data: users,
            })
        } catch (error) {
            return handleError(response, error, 'Unable to retrieve verified users list')
        }
    }

    /** Liste des utilisateurs non vérifiés */
    async unverified({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)
            const search = (request.input('search', '') as string).trim().toLowerCase()

            const users = await User.query()
                .where('is_verified', false)
                .if(search !== '', (query) => {
                    query
                        .whereILike('name', `%${search}%`)
                        .orWhereILike('email', `%${search}%`)
                        .orWhereILike('phone_number', `%${search}%`)
                })
                .orderBy('created_at', 'desc')
                .paginate(page, limit)

            return response.ok({
                status: 'success',
                message: 'List of unverified users',
                data: users,
            })
        } catch (error) {
            return handleError(response, error, 'Unable to retrieve unverified accounts')
        }
    }

    /** Détails d’un utilisateur */
    async show({ params, response }: HttpContext) {
        try {
            const user = await User.query()
                .where('id', params.id)
                .preload('subscriptions')
                .preload('paymentVouchers')
                .preload('notifications')
                .first()

            if (!user) {
                return response.notFound({ status: 'error', message: 'User not found' })
            }

            return response.ok({
                status: 'success',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Unable to display user profile')
        }
    }

    /** Création d’un utilisateur (admin) */
    async store({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(CreateUserValidator)

            const existing = await User.query()
                .where('email', payload.email)
                .orWhere('phone_number', payload.phoneNumber)
                .first()

            if (existing) {
                return response.badRequest({
                    status: 'error',
                    message: 'A user with this email or phone number already exists.',
                })
            }

            const user = await User.create({
                ...payload,
                isVerified: false,
                isBlocked: false,
            })

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.verifyToken = hashed
            user.verifyExpires = DateTime.utc().plus({ hours: 24 })
            await user.save()

            const url = `${env.get('FRONT_URL')}/set-password?userId=${user.id}&token=${rawToken}`
            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activation de votre compte')
                    .htmlView('emails/activation', { user, url })
            })

            return response.created({
                status: 'success',
                message: 'Subscriber created. Please check your email to set your password.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to create user')
        }
    }

    /** Inscription d’un abonné (citoyen ou chercheur) */
    async registerSubscriber({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(RegisterSubscriberValidator)
            const existing = await User.query()
                .where('email', payload.email)
                .orWhere('phone_number', payload.phoneNumber)
                .first()

            if (existing) {
                return response.badRequest({
                    status: 'error',
                    message: 'A user with this email or phone number already exists.',
                })
            }

            // Création avec nom complet automatique
            const user = await User.create({
                ...payload,
                role: UserRole.SUBSCRIBER,
                isVerified: false,
                isBlocked: false,
            })

            // Génération du token de vérification
            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.verifyToken = hashed
            user.verifyExpires = DateTime.utc().plus({ hours: 24 })
            await user.save()

            const url = `${env.get('FRONT_URL')}/set-password?userId=${user.id}&token=${rawToken}`
            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activation de votre compte')
                    .htmlView('emails/activation', { user, url })
            })

            return response.created({
                status: 'success',
                message: 'Subscriber created. Please check your email to set your password.',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to register subscriber')
        }
    }

    /** Mise à jour d’un utilisateur */
    async update({ params, request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(UpdateUserValidator)
            const user = await User.find(params.id)

            if (!user) {
                return response.notFound({ status: 'error', message: 'User not found' })
            }

            user.merge(payload)
            await user.save()

            return response.ok({
                status: 'success',
                message: 'User profile updated successfully',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Unable to update user')
        }
    }

    /** Blocage et déblocage d’utilisateur */
    async block({ params, response }: HttpContext) {
        try {
            const user = await User.find(params.id)
            if (!user) return response.notFound({ status: 'error', message: 'User not found' })

            if (user.isBlocked)
                return response.ok({ status: 'info', message: 'This user is already blocked.' })

            user.isBlocked = true
            await user.save()
            await UserSessionService.end(user.id)

            return response.ok({
                status: 'success',
                message: 'User blocked successfully',
                data: { id: user.id, isBlocked: true },
            })
        } catch (error) {
            return handleError(response, error, 'Unable to block user')
        }
    }

    async unblock({ params, response }: HttpContext) {
        try {
            const user = await User.find(params.id)
            if (!user) return response.notFound({ status: 'error', message: 'User not found' })

            user.isBlocked = false
            await user.save()

            return response.ok({
                status: 'success',
                message: 'User unblocked successfully',
                data: { id: user.id, isBlocked: user.isBlocked },
            })
        } catch (error) {
            return handleError(response, error, 'Unable to unblock user')
        }
    }

    /** Suppression d’un utilisateur */
    async destroy({ params, response }: HttpContext) {
        try {
            const user = await User.find(params.id)
            if (!user) return response.notFound({ status: 'error', message: 'User not found' })

            await user.delete()

            return response.ok({
                status: 'success',
                message: 'User deleted successfully',
            })
        } catch (error) {
            return handleError(response, error, 'Unable to delete user')
        }
    }

    /** Statistiques utilisateurs */
    async stats({ response }: HttpContext) {
        try {
            const total = await User.query().count('* as total')
            const active = await User.query()
                .where('is_blocked', false)
                .andWhere('is_verified', true)
                .count('* as total')
            const blocked = await User.query().where('is_blocked', true).count('* as total')
            const unverified = await User.query().where('is_verified', false).count('* as total')

            return response.ok({
                status: 'success',
                message: 'User statistics retrieved successfully',
                data: {
                    total: Number(total[0].$extras.total),
                    active: Number(active[0].$extras.total),
                    blocked: Number(blocked[0].$extras.total),
                    unverified: Number(unverified[0].$extras.total),
                },
            })
        } catch (error) {
            return handleError(response, error, 'Unable to retrieve user statistics')
        }
    }
}
