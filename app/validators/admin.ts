import vine from '@vinejs/vine'
import { Role } from '../types/role/index.js'
export const createAdminValidator = vine.compile(
    vine.object({
        email: vine.string().email().unique({ table: 'users', column: 'email' }),
        firstName: vine.string().minLength(3),
        name: vine.string().minLength(3),
        role: vine.enum(Object.values(Role)),
    }),
)

export const updateAdminValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional(),
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
    }),
)
