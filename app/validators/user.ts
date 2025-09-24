// src/validators/index.ts
import vine from '@vinejs/vine'
import { Gender } from '#types/gender'
import { Faculty } from '#types/faculty'
import { Promotion } from '#types/promotion'
import { Role } from '#types/role'

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
        faculty: vine.enum(Object.values(Faculty)),
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
        faculty: vine.enum(Object.values(Faculty)).optional(),
        department: vine.string().optional(),
        promotion: vine.enum(Object.values(Promotion)).optional(),
        photoUrl: vine.string().url().optional(),
    }),
)

/**
 * -------------------------
 * CREATE ADMIN VALIDATOR
 * -------------------------
 */
export const createManagerValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email().unique({ table: 'users', column: 'email' }),
        firstName: vine.string().minLength(3),
        name: vine.string().minLength(3),
        lastName: vine.string().minLength(3),
        role: vine.enum([Role.ADMIN, Role.MANAGER]),
    }),
)

/**
 * -------------------------
 * UPDATE ADMIN VALIDATOR
 * -------------------------
 */
export const updateAdminValidator = vine.compile(
    vine.object({
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
