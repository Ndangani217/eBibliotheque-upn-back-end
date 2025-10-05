// src/validators/index.ts
import vine from '@vinejs/vine'
import { Gender } from '#types/gender'
import { Promotion } from '#types/promotion'

/**
 * -------------------------
 * LOGIN VALIDATOR
 * -------------------------
 */
export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email(),
        password: vine.string().trim().minLength(6),
    }),
)

/**
 * -------------------------
 * ADD PASSWORD VALIDATOR
 * -------------------------
 */
export const AddPasswordValidator = vine.compile(
    vine.object({
        password: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
        token: vine.string(),
    }),
)

/**
 * -------------------------
 * CREATE STUDENT VALIDATOR
 * -------------------------
 */
export const createStudentValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email().unique({ table: 'users', column: 'email' }),
        firstName: vine.string().minLength(3),
        name: vine.string().minLength(3),
        lastName: vine.string().minLength(3),
        gender: vine.enum(Object.values(Gender)),
        phoneNumber: vine
            .string()
            .regex(/^(?:\+243|0)[1-9]\d{8}$/)
            .optional(),
        facultyId: vine.number().exists({ table: 'faculties', column: 'id' }),

        department: vine.string(),
        promotion: vine.enum(Object.values(Promotion)),
        photoUrl: vine.string().url().optional(),
    }),
)

/**
 * -------------------------
 * UPDATE STUDENT VALIDATOR
 * -------------------------
 */
export const updateStudentValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email().unique({ table: 'users', column: 'email' }).optional(),
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
        lastName: vine.string().minLength(3).optional(),
        gender: vine.enum(Object.values(Gender)).optional(),
        phoneNumber: vine
            .string()
            .regex(/^(?:\+243|0)[1-9]\d{8}$/)
            .optional(),
        facultyId: vine.number().exists({ table: 'faculties', column: 'id' }).optional(),

        department: vine.string().optional(),
        promotion: vine.enum(Object.values(Promotion)).optional(),
        photoUrl: vine.string().url().optional(),
    }),
)

/**
 * -------------------------
 * ADMIN & MANAGER VALIDATORS
 * -------------------------
 */
const baseUserSchema = {
    firstName: vine.string().minLength(3),
    name: vine.string().minLength(3),
    lastName: vine.string().minLength(3),
    phoneNumber: vine
        .string()
        .regex(/^(?:\+243|0)[1-9]\d{8}$/)
        .optional(),
}

const emailRequired = {
    email: vine.string().trim().email().unique({ table: 'users', column: 'email' }),
}

const emailOptional = {
    email: vine.string().trim().email().unique({ table: 'users', column: 'email' }).optional(),
}

export const createAdminValidator = vine.compile(
    vine.object({
        ...baseUserSchema,
        ...emailRequired,
    }),
)

export const updateAdminValidator = vine.compile(
    vine.object({
        ...baseUserSchema,
        ...emailOptional,
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
        lastName: vine.string().minLength(3).optional(),
    }),
)

export const createManagerValidator = vine.compile(
    vine.object({
        ...baseUserSchema,
        ...emailRequired,
    }),
)

export const updateManagerValidator = vine.compile(
    vine.object({
        ...baseUserSchema,
        ...emailOptional,
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
        lastName: vine.string().minLength(3).optional(),
    }),
)

/**
 * -------------------------
 * ASSIGN STUDENT VALIDATOR
 * -------------------------
 */
export const assignStudentValidator = vine.compile(
    vine.object({
        studentId: vine.number(),
    }),
)

/**
 * -------------------------
 * PASSWORD VALIDATORS
 * -------------------------
 */
export const forgotPasswordValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
    }),
)

export const resetPasswordValidator = vine.compile(
    vine.object({
        password: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
    }),
)

export const changePasswordValidator = vine.compile(
    vine.object({
        currentPassword: vine.string(),
        newPassword: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
    }),
)
