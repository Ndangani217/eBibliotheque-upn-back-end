import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Student from '#models/student'
import Admin from '#models/admin'
import { Role } from '../types/role/index.js'
import crypto from 'node:crypto'
import Mail from '@adonisjs/mail/services/main'
import { loginValidator } from '#validators/user'
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
                .whereHas('user', (q) => q.where('role', Role.ADMIN))
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
                .whereHas('user', (q) => q.where('role', Role.ADMIN))
                .first()

            if (!admin) return response.status(404).json({ message: 'Admin not found' })
            return response.json({ status: 'success', message: 'Admin details', data: admin })
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
            console.log(payload)

            const verifyToken = crypto.randomBytes(32).toString('hex')

            /*const user = await User.create({
                email: payload.email,
                password: payload.password,
                role: Role.STUDENT,
                isVerified: false,
            })

            const student = await Student.create({
                userId: user.id,
                firstName: payload.firstName,
                lastName: payload.lastName,
                gender: payload.gender,
                phoneNumber: payload.phoneNumber,
                faculty: payload.faculty,
                department: payload.department,
                promotion: payload.promotion,
                photoUrl: payload.photoUrl,
            })

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
            const payload = await request.validateUsing(createAdminValidator)
            const verifyToken = crypto.randomBytes(32).toString('hex')

            const user = await User.create({
                email: payload.email,
                password: payload.password,
                role: Role.ADMIN,
                isVerified: false,
            })

            const admin = await Admin.create({
                userId: user.id,
                firstName: payload.firstName,
                name: payload.name,
            })

            const verifyUrl = `https://ton-domaine.com/users/verify/${verifyToken}`
            await Mail.send((message) => {
                message
                    .to(user.email)
                    .from('no-reply@ton-domaine.com')
                    .subject('Validez votre compte')
                    .htmlView('emails/verify', { verifyUrl })
            })

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

    // -------------------------
    // UPDATE / DELETE
    // -------------------------
    /*async updateStudent({ params, request, response }: HttpContext) {
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
    async verifyEmail({ params, response }: HttpContext) {
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
    }

    // -------------------------
    // Login / Logout
    // -------------------------
    async login({ request, auth, response }: HttpContext) {
        try {
            const { email, password } = await request.validateUsing(loginValidator)

            const token = await auth.use('api').attempt(email, password, {
                expiresIn: '7days',
            })

            return response.json({
                status: 'success',
                message: 'Logged in successfully',
                data: { token, user: auth.user },
            })
        } catch (error) {
            console.error(error)
            return response.status(401).json({ status: 'error', message: 'Invalid credentials' })
        }
    }

    async logout({ auth, response }: HttpContext) {
        try {
            await auth.use('api').revoke()
            return response.json({ status: 'success', message: 'Logged out successfully' })
        } catch (error) {
            console.error(error)
            return response.status(500).json({ status: 'error', message: 'Failed to logout' })
        }
    }*/
}
