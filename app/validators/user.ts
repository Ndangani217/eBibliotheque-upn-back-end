import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().minLength(8),
    }),
)

export const updateAdminValidator = vine.compile(
    vine.object({
        firstName: vine.string().minLength(3).optional(),
        name: vine.string().minLength(3).optional(),
    }),
)
