/**
 * Service de gestion des utilisateurs
 */
import User from '#models/user'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import { UserRole, SubscriberCategory } from '#enums/library_enums'
import UserSessionService from '#services/users/user_session_service'
import Mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export interface CreateUserPayload {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    role: UserRole
    category?: SubscriberCategory | string
    matricule?: string
}

export interface UpdateUserPayload {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    category?: string
    matricule?: string
}

export interface UserStats {
    total: number
    active: number
    blocked: number
    unverified: number
}

export class UserService {
    /**
     * Liste les utilisateurs avec pagination et recherche
     */
    static async listUsers(options: {
        page?: number
        limit?: number
        search?: string
        roles?: UserRole[]
        verified?: boolean
    }) {
        const { page = 1, limit = 10, search = '', roles, verified } = options

        const query = User.query()

        if (roles && roles.length > 0) {
            query.whereIn('role', roles)
        }

        if (verified !== undefined) {
            query.where('is_verified', verified)
        }

        if (search) {
            const searchLower = search.trim().toLowerCase()
            query.where((q) => {
                q.whereILike('first_name', `%${searchLower}%`)
                    .orWhereILike('last_name', `%${searchLower}%`)
                    .orWhereILike('email', `%${searchLower}%`)
                    .orWhereILike('phone_number', `%${searchLower}%`)
            })
        }

        query.orderBy('created_at', 'desc')

        return await query.paginate(page, limit)
    }

    /**
     * Récupère un utilisateur par ID
     */
    static async getUserById(id: string) {
        const user = await User.query()
            .where('id', id)
            .preload('subscriptions')
            .preload('paymentVouchers')
            .first()

        if (!user) {
            throw new Error('User not found')
        }

        return user
    }

    /**
     * Crée un nouvel utilisateur
     */
    static async createUser(payload: CreateUserPayload) {
        // Vérifier si l'utilisateur existe déjà
        const existing = await User.query()
            .where('email', payload.email)
            .orWhere('phone_number', payload.phoneNumber)
            .first()

        if (existing) {
            throw new Error('A user with this email or phone number already exists.')
        }

        // Créer l'utilisateur
        const user = await User.create({
            ...payload,
            category: payload.category
                ? (payload.category as SubscriberCategory)
                : null,
            isVerified: false,
            isBlocked: false,
        })

        // Générer le token de vérification
        const rawToken = crypto.randomBytes(32).toString('hex')
        const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

        user.verifyToken = hashed
        user.verifyExpires = DateTime.utc().plus({ hours: 24 })
        await user.save()

        // Envoyer l'email d'activation
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

        return user
    }

    /**
     * Inscrit un nouvel abonné
     */
    static async registerSubscriber(payload: Omit<CreateUserPayload, 'role'>) {
        // Vérifier si l'utilisateur existe déjà
        const existing = await User.query()
            .where('email', payload.email)
            .orWhere('phone_number', payload.phoneNumber)
            .first()

        if (existing) {
            throw new Error('A user with this email or phone number already exists.')
        }

        // Créer l'utilisateur avec le rôle SUBSCRIBER
        const user = await User.create({
            ...payload,
            role: UserRole.SUBSCRIBER,
            category: payload.category
                ? (payload.category as SubscriberCategory)
                : null,
            isVerified: false,
            isBlocked: false,
        })

        // Générer le token de vérification
        const rawToken = crypto.randomBytes(32).toString('hex')
        const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

        user.verifyToken = hashed
        user.verifyExpires = DateTime.utc().plus({ hours: 24 })
        await user.save()

        // Envoyer l'email d'activation
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

        return user
    }

    /**
     * Met à jour un utilisateur
     */
    static async updateUser(id: string, payload: UpdateUserPayload) {
        const user = await User.find(id)

        if (!user) {
            throw new Error('User not found')
        }

        user.merge({
            ...payload,
            category: payload.category
                ? (payload.category as SubscriberCategory)
                : payload.category === undefined
                ? undefined
                : null,
        })
        await user.save()

        return user
    }

    /**
     * Bloque un utilisateur
     */
    static async blockUser(id: string) {
        const user = await User.find(id)

        if (!user) {
            throw new Error('User not found')
        }

        if (user.isBlocked) {
            throw new Error('This user is already blocked.')
        }

        user.isBlocked = true
        await user.save()
        await UserSessionService.end(user.id)

        return user
    }

    /**
     * Débloque un utilisateur
     */
    static async unblockUser(id: string) {
        const user = await User.find(id)

        if (!user) {
            throw new Error('User not found')
        }

        user.isBlocked = false
        await user.save()

        return user
    }

    /**
     * Supprime un utilisateur
     */
    static async deleteUser(id: string) {
        const user = await User.find(id)

        if (!user) {
            throw new Error('User not found')
        }

        await user.delete()
    }

    /**
     * Récupère les statistiques des utilisateurs
     */
    static async getUserStats(): Promise<UserStats> {
        const [total, active, blocked, unverified] = await Promise.all([
            User.query().count('* as total'),
            User.query()
                .where('is_blocked', false)
                .andWhere('is_verified', true)
                .count('* as total'),
            User.query().where('is_blocked', true).count('* as total'),
            User.query().where('is_verified', false).count('* as total'),
        ])

        return {
            total: Number(total[0].$extras.total),
            active: Number(active[0].$extras.total),
            blocked: Number(blocked[0].$extras.total),
            unverified: Number(unverified[0].$extras.total),
        }
    }
}

