import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().minLength(6),
    }),
)

export const updateAdminValidator = vine.compile(
    vine.object({
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
    }),
)

export const AddPasswordValidator = vine.compile(
    vine.object({
        password: vine
            .string()
            .minLength(8)
            .maxLength(32)
            .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
    }),
)
