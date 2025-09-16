import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Student from '#models/student'
import Admin from '#models/admin'
import { Role } from '../types/role/index.js'
//import crypto from 'node:crypto'
//import Mail from '@adonisjs/mail/services/main'
import { loginValidator, AddPasswordalidator } from '#validators/user'
import { createStudentValidator, updateStudentValidator } from '#validators/student'
import { createAdminValidator, updateAdminValidator } from '#validators/admin'

export default class UsersController {
    // -------------------------
    // GET Students / Admins
    // -------------------------
    async getStudents({ response }: HttpContext) {
        try {
            const students = await Student.query()
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.STUDENT))
            return response.json({ data: students })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'Failed to get students' })
        }
    }

    async getStudentById({ params, response }: HttpContext) {
        try {
            const student = await Student.query()
                .where('id', params.id)
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.STUDENT))
                .first()

            if (!student) return response.status(404).json({ message: 'Student not found' })
            return response.json({ status: 'success', message: 'Student details', data: student })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'Failed to get student' })
        }
    }

    async getAdmins({ response }: HttpContext) {
        try {
            const admins = await Admin.query()
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.MANAGER))
            return response.json({ data: admins })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'Failed to get admins' })
        }
    }

    async getAdminById({ params, response }: HttpContext) {
        try {
            const admin = await Admin.query()
                .where('id', params.id)
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.MANAGER))
                .first()

            if (!admin) return response.status(404).json({ message: 'Admin not found' })
            return response.created({ status: 'success', message: 'Admin details', data: admin })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ error: 'Failed to get admin' })
        }
    }

    // -------------------------
    // CREATE Student / Admin
    // -------------------------
    async createStudent({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createStudentValidator)

            //const verifyToken = crypto.randomBytes(32).toString('hex')

            const user = await User.create({
                email: payload.email,
                role: Role.STUDENT,
                isVerified: true, // à modifier en false
            })

            const student = await Student.create({
                userId: user.id,
                firstName: payload.firstName,
                name: payload.name,
                lastName: payload.lastName,
                gender: payload.gender,
                phoneNumber: payload.phoneNumber,
                facultyCode: payload.faculty,
                department: payload.department,
                promotion: payload.promotion,
                photoUrl: payload.photoUrl,
            })
            /*
            const verifyUrl = `https://ton-domaine.com/users/verify/${verifyToken}`
            await Mail.send((message) => {
                message
                    .to(user.email)
                    .from('no-reply@ton-domaine.com')
                    .subject('Validez votre compte')
                    .htmlView('emails/verify', { verifyUrl })
            })*/

            return response.created({
                status: 'success',
                message: 'Student created successfully. Check email to verify.',
                data: { user, student },
            })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .json({ status: 'error', message: 'Failed to create student' })
        }
    }

    async createAdmin({ request, response }: HttpContext) {
        try {
            console.log(request.all())
            const payload = await request.validateUsing(createAdminValidator)
            //const verifyToken = crypto.randomBytes(32).toString('hex')

            const user = await User.create({
                email: payload.email,
                role: payload.role,
                isVerified: false,
            })

            const admin = await Admin.create({
                userId: user.id,
                firstName: payload.firstName,
                name: payload.name,
            })

            /*const verifyUrl = `https://ton-domaine.com/users/verify/${verifyToken}`
            await Mail.send((message) => {
                message
                    .to(user.email)
                    .from('no-reply@ton-domaine.com')
                    .subject('Validez votre compte')
                    .htmlView('emails/verify', { verifyUrl })
            })*/

            return response.created({
                status: 'success',
                message: 'Admin created successfully. Check email to verify.',
                data: { user, admin },
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ status: 'error', message: 'Failed to create admin' })
        }
    }

    async addPassword({ params, request, response }: HttpContext) {
        try {
            const { password } = await request.validateUsing(AddPasswordalidator)
            const user = await User.find(params.id)
            if (!user) {
                return response.notFound({
                    status: 'error',
                    message: 'User not found',
                })
            }

            if (user.password) {
                return response.badRequest({
                    status: 'error',
                    message: 'Password already set. Use changePassword instead.',
                })
            }

            user.password = password
            await user.save()

            return response.ok({
                status: 'success',
                message: 'Password set successfully',
                data: { id: user.id, email: user.email },
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Failed to set password',
            })
        }
    }

    // -------------------------
    // UPDATE / DELETE
    // -------------------------
    async updateStudent({ params, request, response }: HttpContext) {
        try {
            const student = await Student.find(params.id)
            if (!student) return response.status(404).json({ message: 'Student not found' })

            const payload = await request.validateUsing(updateStudentValidator)
            student.merge(payload)
            await student.save()

            return response.json({
                status: 'success',
                message: 'Student updated successfully',
                data: student,
            })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .json({ status: 'error', message: 'Failed to update student' })
        }
    }

    async updateAdmin({ params, request, response }: HttpContext) {
        try {
            const admin = await Admin.find(params.id)
            if (!admin) return response.status(404).json({ message: 'Admin not found' })

            const payload = await request.validateUsing(updateAdminValidator)
            admin.merge(payload)
            await admin.save()

            return response.json({
                status: 'success',
                message: 'Admin updated successfully',
                data: admin,
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ status: 'error', message: 'Failed to update admin' })
        }
    }

    async deleteStudent({ params, response }: HttpContext) {
        try {
            const student = await Student.find(params.id)
            if (!student) return response.status(404).json({ message: 'Student not found' })

            const user = await User.find(student.userId)
            await student.delete()
            if (user) await user.delete()

            return response.json({ status: 'success', message: 'Student deleted successfully' })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .json({ status: 'error', message: 'Failed to delete student' })
        }
    }

    async deleteAdmin({ params, response }: HttpContext) {
        try {
            const admin = await Admin.find(params.id)
            if (!admin) return response.status(404).json({ message: 'Admin not found' })

            const user = await User.find(admin.userId)
            await admin.delete()
            if (user) await user.delete()

            return response.json({ status: 'success', message: 'Admin deleted successfully' })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ status: 'error', message: 'Failed to delete admin' })
        }
    }

    // -------------------------
    // Email verification
    // -------------------------
    /*async verifyEmail({ params, response }: HttpContext) {
        try {
            const user = await User.findBy('verifyToken', params.token)
            if (!user) return response.status(400).json({ message: 'Lien invalide ou expiré' })

            user.isVerified = true
            user.verifyToken = null
            await user.save()

            return response.json({ message: 'Compte vérifié avec succès !' })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ message: 'Erreur lors de la vérification' })
        }
    }

    // -------------------------
    // Forgot password / Reset password
    // -------------------------
    async forgotPassword({ request, response }: HttpContext) {
        try {
            const { email } = request.only(['email'])
            const user = await User.findBy('email', email)
            if (!user) return response.status(404).json({ message: 'Utilisateur non trouvé' })

            const resetToken = crypto.randomBytes(32).toString('hex')
            user.resetToken = resetToken
            user.resetExpires = new Date(Date.now() + 60 * 60 * 1000)
            await user.save()

            const resetUrl = `https://ton-domaine.com/users/reset-password/${resetToken}`
            await Mail.send((message) => {
                message
                    .to(user.email)
                    .from('no-reply@ton-domaine.com')
                    .subject('Réinitialisation de votre mot de passe')
                    .htmlView('emails/reset-password', { resetUrl })
            })

            return response.json({ message: 'Email de réinitialisation envoyé' })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ message: 'Erreur lors de la réinitialisation' })
        }
    }

    async showResetForm({ params, response }: HttpContext) {
        try {
            const user = await User.findBy('resetToken', params.token)
            if (!user || !user.resetExpires || new Date() > new Date(user.resetExpires)) {
                return response.status(400).json({ message: 'Lien invalide ou expiré' })
            }
            return response.json({
                message: 'Token valide, vous pouvez réinitialiser le mot de passe',
            })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ message: 'Erreur lors de la vérification du token' })
        }
    }

    async resetPassword({ params, request, response }: HttpContext) {
        try {
            const { newPassword } = request.only(['newPassword'])
            const user = await User.findBy('resetToken', params.token)
            if (!user || !user.resetExpires || new Date() > new Date(user.resetExpires)) {
                return response.status(400).json({ message: 'Lien invalide ou expiré' })
            }

            user.password = newPassword
            user.resetToken = null
            user.resetExpires = null
            await user.save()

            return response.json({ message: 'Mot de passe réinitialisé avec succès' })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .json({ message: 'Erreur lors de la réinitialisation du mot de passe' })
        }
    }

    async changePassword({ request, auth, response }: HttpContext) {
        try {
            const { currentPassword, newPassword } = request.only([
                'currentPassword',
                'newPassword',
            ])
            const user = auth.user as User

            if (!(await user.verifyPassword(currentPassword))) {
                return response.status(400).json({ message: 'Mot de passe actuel incorrect' })
            }

            user.password = newPassword
            await user.save()

            return response.json({ message: 'Mot de passe changé avec succès' })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .json({ message: 'Erreur lors du changement de mot de passe' })
        }
    }*/

    // -------------------------
    // Login / Logout
    // -------------------------
    async login({ request, auth, response }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(loginValidator)

            const userCurrent = await User.findBy('email', email)
            if (!userCurrent || !userCurrent.isVerified) {
                return response
                    .status(401)
                    .json({ status: 'error', message: 'Invalid credentials' })
            }

            const user = await User.verifyCredentials(email, password)
            const token = await auth.use('api').createToken(user)
            //const token = await User.accessTokens.create(user)

            /*let abilities: number[] = []

           switch (user.role) {
                case Role.ADMIN:
                    abilities = [3] // admin
                    break
                case Role.MANAGER:
                    abilities = [2] // manager
                    break
                case Role.STUDENT:
                    abilities = [1] // student
                    break
            }*/

            return response.json({
                status: 'success',
                message: 'Logged in successfully',
                data: { token, user },
            })
        } catch (error) {
            console.error(error)
            return response.status(401).json({ status: 'error', message: 'Invalid credentials' })
        }
    }

    async logout({ auth, response }: HttpContext) {
        try {
            await auth.use('api').invalidateToken()
            return response.json({ status: 'success', message: 'Logged out successfully' })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ status: 'error', message: 'Failed to logout' })
        }
    }
    // -------------------------
    // Rechercher des étudiants
    // -------------------------
    async searchStudents({ request, response }: HttpContext) {
        try {
            const { name, email, facultyCode } = request.qs()

            const query = Student.query()
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.STUDENT))

            if (email) {
                query.whereHas('user', (q) => {
                    q.where('email', 'ilike', `%${email}%`)
                })
            }

            if (name) {
                query.whereRaw("concat(first_name, ' ', name, ' ', last_name) ilike ?", [
                    `%${name}%`,
                ])
            }

            if (facultyCode) {
                query.where('facultyCode', facultyCode)
            }

            const students = await query

            return response.ok({
                status: 'success',
                message: 'Résultats de recherche des étudiants récupérés avec succès',
                data: students,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de la recherche des étudiants',
            })
        }
    }

    // -------------------------
    // Rechercher des managers
    // -------------------------
    async searchManagers({ request, response }: HttpContext) {
        try {
            const { name, email } = request.qs()

            const query = Admin.query()
                .preload('user')
                .whereHas('user', (q) => q.where('role', Role.MANAGER))

            if (email) {
                query.whereHas('user', (q) => {
                    q.where('email', 'ilike', `%${email}%`)
                })
            }

            if (name) {
                query.whereRaw("concat(first_name, ' ', name) ilike ?", [`%${name}%`])
            }

            const managers = await query

            return response.ok({
                status: 'success',
                message: 'Résultats de recherche des managers récupérés avec succès',
                data: managers,
            })
        } catch (error) {
            console.error(error)
            return response.internalServerError({
                status: 'error',
                message: 'Échec de la recherche des managers',
            })
        }
    }
}
