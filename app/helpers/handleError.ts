// -------------------------
// Helper centralisé pour erreurs
// -------------------------
import type { HttpContext } from '@adonisjs/core/http'
export function HandleError(response: HttpContext['response'], error: any, defaultMessage: string) {
    console.error(error)

    // Erreurs de validation Vine
    if (error.messages) {
        return response.unprocessableEntity({
            status: 'error',
            message: 'Erreur de validation',
            errors: error.messages,
        })
    }

    return response.internalServerError({
        status: 'error',
        message: error.message || defaultMessage,
    })
}
