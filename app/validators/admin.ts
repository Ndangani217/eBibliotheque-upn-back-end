import vine from '@vinejs/vine'
export const createAdminValidator = vine.compile(
    vine.object({
        email: vine.string().email().unique({ table: 'users', column: 'email' }),
        password: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
        firstName: vine.string().minLength(3),
        name: vine.string().minLength(3),
    }),
)

export const updateAdminValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional(),
        password: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
            .optional(),
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
    }),
)
