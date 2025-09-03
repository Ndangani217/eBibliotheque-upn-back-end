import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Student from '#models/student'
import Admin from '#models/admin'
import { Role } from '../types/role/index.js'
import { createAdminValidator, createStudentValidator, loginValidator } from '#validators/user'

export default class UsersController {
  async getStudents({ response }: HttpContext) {
    try {
      const Students = await Student.query().preload('user').where('role', 'STUDENT')
      return response.json({
        data: Students,
      })
    } catch (error) {
      console.log(error)
      return response.status(500).json({ error: 'Failed to get students' })
    }
  }

  async getAdmins({ response }: HttpContext) {
    try {
      const admins = await Admin.query().preload('user').where('role', 'ADMIN')
      return response.json({
        data: admins,
      })
    } catch (error) {
      console.log(error)
      return response.status(500).json({ error: 'Failed to get admins' })
    }
  }

  async getAdminById({ params, response }: HttpContext) {
    try {
      const id = params.id
      const admin = await Admin.query()
        .whereHas('user', (userQuery) => {
          userQuery.where('role', 'ADMIN')
        })
        .where('id', id)
        .preload('user')
        .first()

      if (!admin) {
        return response.status(404).json({
          message: 'Admin not found',
        })
      }
      return response.json({
        status: 'success',
        message: 'Admin details',
        data: admin,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Failed to get admin' })
    }
  }
  async getStudentById({ params, response }: HttpContext) {
    try {
      const id = params.id
      const admin = await Admin.query()
        .whereHas('user', (userQuery) => {
          userQuery.where('role', 'STUDENT')
        })
        .where('id', id)
        .preload('user')
        .first()

      if (!admin) {
        return response.status(404).json({
          message: 'Admin not found',
        })
      }
      return response.json({
        status: 'success',
        message: 'Student details',
        data: admin,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Failed to get admin' })
    }
  }

  async createStudent({ request, auth, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createStudentValidator)
      const user = await User.create({
        email: payload.email,
        password: payload.password,
        role: Role.STUDENT,
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

      const token = await auth.use('api').createToken(user)

      return response.created({
        status: 'success',
        message: 'Student created successfully',
        data: { user, student, token },
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ status: 'error', message: 'Failed to create student' })
    }
  }
  async createAdmin({ request, auth, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createAdminValidator)

      const user = await User.create({
        email: payload.email,
        password: payload.password,
        role: Role.ADMIN,
      })

      const admin = await Admin.create({
        userId: user.id,
        firstName: payload.firstName,
        name: payload.name,
      })

      const token = await auth.use('api').createToken(user)

      return response.created({
        status: 'success',
        message: 'Admin created successfully',
        data: { user, admin, token },
      })
    } catch (error) {
      console.log(error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to create admin',
      })
    }
  }
  async udpdateProfile({}: HttpContext) {}
  async updateAdmin({ params, request, response }: HttpContext) {
    try {
      const admin = await Admin.find(params.id)
      if (!admin) {
        return response.status(404).json({
          message: 'Admin not found',
        })
      }

      const data = request.only(['firstName', 'name'])
      admin.merge(data)
      await admin.save()

      return response.json({
        status: 'success',
        message: 'Admin updated successfully',
        data: admin,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({
        error: 'error',
        message: 'Failed to update admin',
      })
    }
  }
  async updateStudent({ params, request, response }: HttpContext) {
    try {
      const student = await Student.find(params.id)
      if (!student) {
        return response.status(404).json({
          message: 'Student not found',
        })
      }

      const data = request.only([
        'firstName',
        'lastName',
        'gender',
        'phoneNumber',
        'faculty',
        'department',
        'promotion',
        'photoUrl',
      ])

      student.merge(data)
      await student.save()

      return response.json({
        status: 'success',
        message: 'Student updated successfully',
        data: student,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({
        error: 'error',
        message: 'Failed to update student',
      })
    }
  }
  async deleteAdmin({}: HttpContext) {}
  async deleteStudent({}: HttpContext) {}
  async resetPassword({}: HttpContext) {}
  async changePassword({}: HttpContext) {}
  async forgotPassword({}: HttpContext) {}
  async sendOtp({}: HttpContext) {}
  async verifyOtp({}: HttpContext) {}

  async login({}: HttpContext) {}
  async logout({}: HttpContext) {}
}
