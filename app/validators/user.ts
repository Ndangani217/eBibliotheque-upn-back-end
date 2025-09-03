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
  })
)

export const createStudentValidator = vine.compile(
  vine.object({
    email: vine.string().email().unique({ table: 'users', column: 'email' }),
    password: vine.string().minLength(6),
    firstName: vine.string(),
    lastName: vine.string(),
    gender: vine.enum(['M', 'F']),
    phoneNumber: vine.string().regex(/^(?:\+243|0)[1-9]\d{8}$/),
    faculty: vine.string(),
    department: vine.string(),
    promotion: vine.string(),
    photoUrl: vine.string().url().optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8),
  })
)
