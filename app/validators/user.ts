// app/validators/user.ts
import vine from '@vinejs/vine'
import { UserRole, SubscriberCategory } from '#enums/library_enums'

/**
 * Validation lors de la création d’un utilisateur (par admin)
 */
export const CreateUserValidator = vine.compile(
    vine.object({
        lastName: vine.string().trim().minLength(2).maxLength(100),
        firstName: vine.string().trim().minLength(2).maxLength(100),
        email: vine.string().trim().email().maxLength(254),
        phoneNumber: vine
            .string()
            .trim()
            .regex(/^\+?[0-9]{9,15}$/)
            .maxLength(20),
        role: vine.enum(Object.values(UserRole)),
        category: vine.enum(Object.values(SubscriberCategory)).optional(),
        matricule: vine.string().trim().maxLength(50).optional(),
    }),
)

/**
 * Validation lors de la mise à jour d’un utilisateur
 */
export const UpdateUserValidator = vine.compile(
    vine.object({
        lastName: vine.string().trim().minLength(2).maxLength(100).optional(),
        firstName: vine.string().trim().minLength(2).maxLength(100).optional(),
        email: vine.string().trim().email().maxLength(254).optional(),
        phoneNumber: vine
            .string()
            .trim()
            .regex(/^\+?[0-9]{9,15}$/)
            .maxLength(20)
            .optional(),
        role: vine.enum(Object.values(UserRole)).optional(),
        category: vine.enum(Object.values(SubscriberCategory)).optional(),
        matricule: vine.string().trim().maxLength(50).optional(),
    }),
)

/**
 * Validation lors de l’inscription d’un abonné (Register Subscriber)
 * Route : POST /auth/register-subscriber
 */
export const RegisterSubscriberValidator = vine.compile(
    vine.object({
        firstName: vine.string().trim().minLength(2).maxLength(100),
        lastName: vine.string().trim().minLength(2).maxLength(100),
        email: vine.string().trim().email().maxLength(254),
        phoneNumber: vine
            .string()
            .trim()
            .regex(/^(?:\+243|0)?[0-9]{9}$/)
            .maxLength(20),
        category: vine.enum(Object.values(SubscriberCategory)),
    }),
)

/**
 * Validation lors de la définition du mot de passe via le lien e-mail
 * Route : POST /auth/set-password
 */
export const SetPasswordValidator = vine.compile(
    vine.object({
        userId: vine.string().uuid(),
        token: vine.string().trim(),
        password: vine.string().minLength(6).confirmed(),
    }),
)
