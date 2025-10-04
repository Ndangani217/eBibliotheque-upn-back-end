import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { Role } from '#types/role'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import Mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import {
    loginValidator,
    AddPasswordValidator,
    createStudentValidator,
    updateStudentValidator,
    createManagerValidator,
    updateManagerValidator,
    createAdminValidator,
    updateAdminValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
} from '#validators/user'
import { HandleError as handleError } from '#helpers/handleError'
import UserSessionService from '#services/user_session'
import UserSession from '#models/user_session'

export default class UsersController {
    // -------------------------
    // AUTH
    // -------------------------
    async login({ request, auth, response }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(loginValidator)

            const userCurrent = await User.findBy('email', email)
            if (!userCurrent || !userCurrent.isVerified) {
                return response.unauthorized({ status: 'error', message: 'Identifiants invalides' })
            }

            if (userCurrent.isBlocked) {
                return response.forbidden({
                    status: 'error',
                    message: 'Votre compte est bloqué, contactez l’administration',
                })
            }

            const user = await User.verifyCredentials(email, password)
            const token = await auth.use('api').createToken(user)
            await UserSessionService.start(user, { request } as HttpContext)

            return response.ok({
                status: 'success',
                message: 'Connexion réussie',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        isVerified: user.isVerified,
                        firstName: user.firstName,
                        name: user.name,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber,
                        facultyCode: user.faculty?.code,
                        department: user.department,
                        promotion: user.promotion,
                        photoUrl: user.photoUrl,
                    },
                },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de se connecter')
        }
    }

    async logout({ auth, response }: HttpContext) {
        try {
            const user = auth.user
            if (!user) {
                return response.unauthorized({ status: 'error', message: 'Non authentifié' })
            }

            await auth.use('api').invalidateToken()
            await UserSessionService.end(user.id)

            return response.ok({ status: 'success', message: 'Déconnexion réussie' })
        } catch (error) {
            return handleError(response, error, 'Impossible de se déconnecter')
        }
    }

    async me({ auth, response }: HttpContext) {
        try {
            if (!auth.user) {
                return response.unauthorized({
                    status: 'error',
                    message: 'Non authentifié',
                })
            }

            if (auth.user.isBlocked) {
                return response.forbidden({
                    status: 'error',
                    message: 'Votre compte est bloqué, contactez l’administration',
                })
            }

            return response.ok({
                status: 'success',
                data: { user: auth.user },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer le profil')
        }
    }

    // -------------------------
    // GET BY ID
    // -------------------------
    async getStudentById({ params, response }: HttpContext) {
        try {
            const student = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.STUDENT)
                .andWhere('is_verified', true)
                .first()

            if (!student)
                return response.notFound({ status: 'error', message: 'Étudiant introuvable' })

            return response.ok({ status: 'success', data: student })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer l’étudiant')
        }
    }

    async getManagerById({ params, response }: HttpContext) {
        try {
            const manager = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.MANAGER)
                .andWhere('is_verified', true)
                .first()

            if (!manager)
                return response.notFound({ status: 'error', message: 'Manager introuvable' })

            return response.ok({ status: 'success', data: manager })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer le manager')
        }
    }

    async getAdminById({ params, response }: HttpContext) {
        try {
            const admin = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.ADMIN)
                .andWhere('is_verified', true)
                .first()

            if (!admin) return response.notFound({ status: 'error', message: 'Admin introuvable' })

            return response.ok({ status: 'success', data: admin })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer l’admin')
        }
    }

    // -------------------------
    // GET LIST
    // -------------------------
    async getStudents({ response }: HttpContext) {
        try {
            const students = await User.query()
                .where('role', Role.STUDENT)
                .andWhere('is_verified', true)
            return response.ok({ status: 'success', data: students })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer les étudiants')
        }
    }

    async getManagers({ response }: HttpContext) {
        try {
            const managers = await User.query()
                .where('role', Role.MANAGER)
                .andWhere('is_verified', true)
                .preload('sessions', (q) => q.orderBy('login_at', 'desc').limit(1))

            const data = managers.map((m) => {
                const s = m.sessions?.[0]
                const online = !!s && s.logoutAt === null
                const lastConnection = s ? (s.logoutAt ?? s.loginAt) : null

                const base = m.serialize()
                delete (base as any).sessions

                return {
                    ...base,
                    online,
                    lastConnection,
                }
            })

            return response.ok({
                status: 'success',
                message: 'Managers récupérés avec statut',
                data,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer les managers')
        }
    }

    async getAdmins({ response }: HttpContext) {
        try {
            const admins = await User.query()
                .where('role', Role.ADMIN)
                .andWhere('is_verified', true)
            return response.ok({ status: 'success', data: admins })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer les admins')
        }
    }

    // -------------------------
    // CREATE USERS
    // -------------------------
    async createStudent({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createStudentValidator)

            const user = await User.create({
                ...payload,
                role: Role.STUDENT,
                isVerified: false,
            })

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.verifyToken = hashed
            await user.save()

            const url = `${env.get('FRONT_URL')}/confirm-password?userId=${user.id}&token=${rawToken}`

            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activez votre compte')
                    .htmlView('emails/activation', { user, url })
            })

            return response.created({
                status: 'success',
                message:
                    'Étudiant créé avec succès. Un lien d’activation a été envoyé à son adresse email.',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer l’étudiant')
        }
    }

    async createManager({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createManagerValidator)
            const user = await User.create({ ...payload, role: Role.MANAGER, isVerified: false })

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')
            user.verifyToken = hashed
            await user.save()

            const url = `${env.get('FRONT_URL')}/confirm-password?userId=${user.id}&token=${rawToken}`

            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activez votre compte')
                    .htmlView('emails/activation', { user, url })
            })

            return response.created({
                status: 'success',
                message: 'Manager créé avec succès (email envoyé)',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer le manager')
        }
    }

    /**
     * Création d’un admin avec envoi d’un mail d’activation
     */
    async createAdmin({ request, response }: HttpContext) {
        try {
            // 1) Validation
            const payload = await request.validateUsing(createAdminValidator)
            // 2) Création de l'admin
            const user = await User.create({
                ...payload,
                role: Role.ADMIN,
                isVerified: false,
            })

            // 3) Génération du token
            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.verifyToken = hashed
            await user.save()

            // 4) Génération de l’URL (Next.js)
            const url = `${env.get('FRONT_URL')}/confirm-password?userId=${user.id}&token=${rawToken}`

            // 5) Envoi de l’email
            await Mail.use('smtp').send((message) => {
                message
                    .from(
                        env.get('MAIL_FROM_ADDRESS') as string,
                        env.get('MAIL_FROM_NAME') as string,
                    )
                    .to(user.email)
                    .subject('Activez votre compte')
                    .htmlView('emails/activation', { user, url })
            })

            // 6) Réponse API sécurisée
            return response.created({
                status: 'success',
                message: 'Admin créé avec succès. Un email d’activation a été envoyé.',
                data: {
                    id: user.id,
                    email: user.email,
                },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer l’admin')
        }
    }
    // -------------------------
    // ADD PASSWORD
    // -------------------------
    /*async addPassword({ params, request, response }: HttpContext) {
        try {
            const { password } = await request.validateUsing(AddPasswordValidator)
            const user = await User.find(params.id)
            if (!user)
                return response.notFound({ status: 'error', message: 'Utilisateur introuvable' })

            if (user.password) {
                return response.badRequest({ status: 'error', message: 'Mot de passe déjà défini' })
            }

            user.password = password
            user.isVerified = true
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Mot de passe défini avec succès',
                data: { id: user.id, email: user.email },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de définir le mot de passe')
        }
    }*/

    // -------------------------
    // SET PASSWORD AFTER ACTIVATION
    // -------------------------
    async addPassword({ params, request, response }: HttpContext) {
        try {
            const { password, token } = await request.validateUsing(AddPasswordValidator)

            const user = await User.find(params.id)
            if (!user) {
                return response.notFound({ status: 'error', message: 'Utilisateur introuvable' })
            }

            if (user.password) {
                return response.badRequest({ status: 'error', message: 'Mot de passe déjà défini' })
            }

            // Vérif du token
            const hashed = crypto.createHash('sha256').update(token).digest('hex')
            if (!user.verifyToken || user.verifyToken !== hashed) {
                return response.badRequest({
                    status: 'error',
                    message: 'Lien d’activation invalide',
                })
            }

            user.password = password
            user.isVerified = true
            user.verifyToken = null
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Mot de passe défini avec succès',
                data: { id: user.id, email: user.email },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de définir le mot de passe')
        }
    }

    // -------------------------
    // UPDATE USERS
    // -------------------------
    async updateStudent({ params, request, response }: HttpContext) {
        try {
            const user = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.STUDENT)
                .first()
            if (!user)
                return response.notFound({ status: 'error', message: 'Étudiant introuvable' })

            const payload = await request.validateUsing(updateStudentValidator)
            user.merge(payload)
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Étudiant mis à jour avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de mettre à jour l’étudiant')
        }
    }

    async updateManager({ params, request, response }: HttpContext) {
        try {
            const user = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.MANAGER)
                .first()
            if (!user) return response.notFound({ status: 'error', message: 'Manager introuvable' })

            const payload = await request.validateUsing(updateManagerValidator)
            user.merge(payload)
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Manager mis à jour avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de mettre à jour le manager')
        }
    }

    async updateAdmin({ params, request, response }: HttpContext) {
        try {
            const user = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.ADMIN)
                .first()
            if (!user) return response.notFound({ status: 'error', message: 'Admin introuvable' })

            const payload = await request.validateUsing(updateAdminValidator)
            user.merge(payload)
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Admin mis à jour avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de mettre à jour l’admin')
        }
    }

    // -------------------------
    // SEARCH USERS
    // -------------------------
    async searchStudents({ request, response }: HttpContext) {
        try {
            const { name } = request.qs()
            const query = User.query().where('role', Role.STUDENT).andWhere('is_verified', true)

            if (name) {
                query.where((subQuery) => {
                    subQuery
                        .whereILike('first_name', `%${name}%`)
                        .orWhereILike('name', `%${name}%`)
                        .orWhereILike('last_name', `%${name}%`)
                })
            }

            const students = await query
            return response.ok({
                status: 'success',
                message: 'Résultats de recherche des étudiants récupérés',
                data: students,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la recherche des étudiants')
        }
    }

    async searchManagers({ request, response }: HttpContext) {
        try {
            const { name, email } = request.qs()
            const query = User.query().where('role', Role.MANAGER).andWhere('is_verified', true)

            if (email) query.whereILike('email', `%${email}%`)
            if (name) {
                query.whereRaw("concat(first_name, ' ', name, ' ', last_name) ILIKE ?", [
                    `%${name}%`,
                ])
            }

            const managers = await query
            return response.ok({
                status: 'success',
                message: 'Résultats de recherche des managers récupérés',
                data: managers,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la recherche des managers')
        }
    }

    async searchAdmins({ request, response }: HttpContext) {
        try {
            const { name, email } = request.qs()
            const query = User.query().where('role', Role.ADMIN).andWhere('is_verified', true)

            if (email) query.whereILike('email', `%${email}%`)
            if (name) {
                query.whereRaw("concat(first_name, ' ', name, ' ', last_name) ILIKE ?", [
                    `%${name}%`,
                ])
            }

            const admins = await query
            return response.ok({
                status: 'success',
                message: 'Résultats de recherche des admins récupérés',
                data: admins,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la recherche des admins')
        }
    }

    // -------------------------
    // DELETE USERS
    // -------------------------
    async deleteStudent({ params, response }: HttpContext) {
        try {
            const student = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.STUDENT)
                .first()
            if (!student)
                return response.notFound({ status: 'error', message: 'Étudiant introuvable' })

            await student.delete()
            return response.ok({ status: 'success', message: 'Étudiant supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer l’étudiant')
        }
    }

    async deleteManager({ params, response }: HttpContext) {
        try {
            const manager = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.MANAGER)
                .first()
            if (!manager)
                return response.notFound({ status: 'error', message: 'Manager introuvable' })

            await manager.delete()
            return response.ok({ status: 'success', message: 'Manager supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer le manager')
        }
    }

    async deleteAdmin({ params, response }: HttpContext) {
        try {
            const admin = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.ADMIN)
                .first()
            if (!admin) return response.notFound({ status: 'error', message: 'Admin introuvable' })

            await admin.delete()
            return response.ok({ status: 'success', message: 'Admin supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer l’admin')
        }
    }

    // -------------------------
    // PASSWORD RESET
    // -------------------------
    async forgotPassword({ request, response }: HttpContext) {
        try {
            const { email } = await request.validateUsing(forgotPasswordValidator)
            const user = await User.findBy('email', email)
            if (!user) {
                return response.ok({
                    status: 'success',
                    message:
                        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
                })
            }

            const rawToken = crypto.randomBytes(32).toString('hex')
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex')

            user.resetToken = hashed
            user.resetExpires = DateTime.utc().plus({ hours: 1 })
            await user.save()

            const resetUrl = `${process.env.FRONT_URL}/confirm-password/${rawToken}`

            return response.ok({
                status: 'success',
                message: 'Un email de réinitialisation a été envoyé',
                data: { resetUrl }, // utile en dev
            })
        } catch (error) {
            return handleError(response, error, 'Impossible d’initier la réinitialisation')
        }
    }

    async resetPassword({ params, request, response }: HttpContext) {
        try {
            const { password } = await request.validateUsing(resetPasswordValidator)
            const hashed = crypto.createHash('sha256').update(params.token).digest('hex')

            const user = await User.query()
                .where('reset_token', hashed)
                .andWhere('reset_expires', '>', DateTime.utc().toSQL())
                .first()

            if (!user) {
                return response.badRequest({ status: 'error', message: 'Lien invalide ou expiré' })
            }

            user.password = password
            user.resetToken = null
            user.resetExpires = null
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Mot de passe réinitialisé avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de réinitialiser le mot de passe')
        }
    }

    async sessionsOfDay({ params, request, response }: HttpContext) {
        try {
            const userId = Number(params.id)
            const dateStr = request.input('date') // 'YYYY-MM-DD'
            const day = dateStr ? DateTime.fromISO(dateStr) : DateTime.now()

            const sessions = await UserSession.query()
                .where('user_id', userId)
                .whereBetween('login_at', [day.startOf('day').toSQL()!, day.endOf('day').toSQL()!])
                .orderBy('login_at', 'asc')

            return response.ok({
                status: 'success',
                message: 'Sessions de la journée récupérées',
                data: sessions,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer les sessions')
        }
    }

    /**
     * Bloquer un manager
     */
    async block({ params, response }: HttpContext) {
        try {
            const manager = await User.findOrFail(params.id)
            manager.isBlocked = true
            await manager.save()

            return response.ok({
                status: 'success',
                message: 'Manager bloqué avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de bloquer ce manager')
        }
    }

    /**
     * Débloquer un manager
     */
    async unblock({ params, response }: HttpContext) {
        try {
            const manager = await User.findOrFail(params.id)
            manager.isBlocked = false
            await manager.save()

            return response.ok({
                status: 'success',
                message: 'Manager débloqué avec succès',
            })
        } catch (error) {
            console.error('Erreur lors du déblocage du manager :', error)
            return handleError(response, error, 'Impossible de débloquer ce manager')
        }
    }
}
