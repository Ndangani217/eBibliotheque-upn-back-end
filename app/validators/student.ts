import vine from '@vinejs/vine'
import { Promotion } from '../types/promotion/index.js'
import { Faculty } from '../types/faculty/faculty.js'
import { Sexe } from '../types/sexe/index.js'

export const createStudentValidator = vine.compile(
    vine.object({
        email: vine.string().email().unique({ table: 'users', column: 'email' }),
        password: vine.string().minLength(6),
        firstName: vine.string(),
        lastName: vine.string(),
        gender: vine.enum(Object.values(Sexe)),
        phoneNumber: vine.string().regex(/^(?:\+243|0)[1-9]\d{8}$/),
        faculty: vine.enum(Object.values(Faculty)),
        department: vine.string(),
        promotion: vine.enum(Object.values(Promotion)),
        photoUrl: vine.string().url().optional(),
    }),
)

export const updateStudentValidator = vine.compile(
    vine.object({
        firstName: vine.string().minLength(2).optional(),
        lastName: vine.string().minLength(2).optional(),
        gender: vine.enum(Object.values(Sexe)),
        phoneNumber: vine
            .string()
            .regex(/^(?:\+243|0)[1-9]\d{8}$/)
            .optional(),
        faculty: vine.enum(Object.values(Faculty)).optional(),
        department: vine.string().minLength(2).optional(),
        promotion: vine.enum(Object.values(Promotion)).optional(),
        photoUrl: vine.string().url().optional(),
    }),
)
