import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { Role } from '#types/role'
import crypto from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import {
    loginValidator,
    AddPasswordValidator,
    createStudentValidator,
    updateStudentValidator,
    createManagerValidator,
    updateAdminValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
} from '#validators/user'

// -------------------------
// Helper centralisé pour erreurs
// -------------------------
function handleError(response: HttpContext['response'], error: any, defaultMessage: string) {
    console.error(error)

    // Erreurs de validation Vine
    if (error.messages) {
        return response.unprocessableEntity({
            status: 'error',
            message: 'Erreur de validation',
            errors: error.messages,
        })
    }

    return response.internalServerError({
        status: 'error',
        message: error.message || defaultMessage,
    })
}

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

            const user = await User.verifyCredentials(email, password)
            const token = await auth.use('api').createToken(user)

            return response.ok({
                status: 'success',
                message: 'Connexion réussie',
                data: { token, user },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de se connecter')
        }
    }

    async logout({ auth, response }: HttpContext) {
        try {
            await auth.use('api').invalidateToken()
            return response.ok({ status: 'success', message: 'Déconnexion réussie' })
        } catch (error) {
            return handleError(response, error, 'Impossible de se déconnecter')
        }
    }

    async me({ auth, response }: HttpContext) {
        try {
            if (!auth.user) {
                return response.unauthorized({ status: 'error', message: 'Non authentifié' })
            }

            return response.ok({
                status: 'success',
                data: {
                    user: {
                        id: auth.user.id,
                        email: auth.user.email,
                        role: auth.user.role,
                        isVerified: auth.user.isVerified,
                        firstName: auth.user.firstName,
                        name: auth.user.name,
                        lastName: auth.user.lastName,
                    },
                },
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer le profil')
        }
    }
    async getStudentById({ params, response }: HttpContext) {
        try {
            const student = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.STUDENT)
                .andWhere('is_verified', true)
                .first()

            if (!student) {
                return response.notFound({ status: 'error', message: 'Étudiant introuvable' })
            }

            return response.ok({ status: 'success', data: student })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer l’étudiant')
        }
    }
    async getManagerById({ params, response }: HttpContext) {
        try {
            const student = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.MANAGER)
                .andWhere('is_verified', true)
                .first()

            if (!student) {
                return response.notFound({ status: 'error', message: 'Manager introuvable' })
            }

            return response.ok({ status: 'success', data: student })
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

            if (!admin) {
                return response.notFound({ status: 'error', message: 'Admin introuvable' })
            }

            return response.ok({ status: 'success', data: admin })
        } catch (error) {
            return handleError(response, error, 'Impossible de récupérer l’admin')
        }
    }

    // -------------------------
    // GET USERS
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

            return response.ok({ status: 'success', data: managers })
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

            return response.created({
                status: 'success',
                message: 'Étudiant créé avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer l’étudiant')
        }
    }

    async createManager({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createManagerValidator)

            const user = await User.create({
                ...payload,
                role: Role.MANAGER,
                isVerified: false,
            })

            return response.created({
                status: 'success',
                message: 'Manager créé avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer le manager')
        }
    }

    async createAdmin({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(updateAdminValidator)

            const user = await User.create({
                ...payload,
                role: Role.ADMIN,
                isVerified: false,
            })

            return response.created({
                status: 'success',
                message: 'Admin créé avec succès',
                data: user,
            })
        } catch (error) {
            return handleError(response, error, 'Impossible de créer l’admin')
        }
    }

    // -------------------------
    // ADD PASSWORD
    // -------------------------
    async addPassword({ params, request, response }: HttpContext) {
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

            const payload = await request.validateUsing(updateAdminValidator)
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
            const { name, email, facultyCode } = request.qs()

            const query = User.query().where('role', Role.STUDENT).andWhere('is_verified', true)

            if (email) query.whereILike('email', `%${email}%`)
            if (name) {
                query.whereRaw("concat(first_name, ' ', name, ' ', last_name) ILIKE ?", [
                    `%${name}%`,
                ])
            }
            if (facultyCode) query.where('faculty_code', facultyCode)

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
    // DELETE USER
    // -------------------------

    async deleteStudent({ params, response }: HttpContext) {
        try {
            const student = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.STUDENT)
                .first()

            if (!student) {
                return response.notFound({ status: 'error', message: 'Étudiant introuvable' })
            }

            await student.delete()
            return response.ok({ status: 'success', message: 'Étudiant supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer l’étudiant')
        }
    }

    async deleteManager({ params, response }: HttpContext) {
        try {
            const admin = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.MANAGER)
                .first()

            if (!admin) {
                return response.notFound({ status: 'error', message: 'Manager introuvable' })
            }

            await admin.delete()
            return response.ok({ status: 'success', message: 'Manager supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer le Manager')
        }
    }

    async deleteAdmin({ params, response }: HttpContext) {
        try {
            const admin = await User.query()
                .where('id', params.id)
                .andWhere('role', Role.ADMIN)
                .first()

            if (!admin) {
                return response.notFound({ status: 'error', message: 'Admin introuvable' })
            }

            await admin.delete()
            return response.ok({ status: 'success', message: 'Admin supprimé avec succès' })
        } catch (error) {
            return handleError(response, error, 'Impossible de supprimer l’admin')
        }
    }

    /**
     * POST /users/forgot-password
     * Crée un token de reset et envoie (ou retourne) l’info
     */
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

            /*
            await Mail.send((message) => {
                message
                .to(user.email)
                .from('no-reply@monapp.com')
                .subject('Réinitialisation de votre mot de passe')
                .htmlView('emails/confirm-password', { resetUrl })
            })
            */
            return response.ok({
                status: 'success',
                message: 'Un email de réinitialisation a été envoyé',
                data: {
                    resetUrl, // pratique pour dev front
                },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Impossible d’initier la réinitialisation',
            })
        }
    }
}
