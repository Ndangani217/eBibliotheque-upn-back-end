/**
 * Helpers pour créer des réponses API standardisées
 */
import type { HttpContext } from '@adonisjs/core/http'
import type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from '#types/api_response'

export class ApiResponseHelper {
    /**
     * Crée une réponse de succès
     */
    static success<T>(
        response: HttpContext['response'],
        data: T,
        message: string = 'Operation successful',
        meta?: PaginationMeta,
    ) {
        const payload: ApiSuccessResponse<T> = {
            status: 'success',
            message,
            data,
        }

        if (meta) {
            payload.meta = meta
        }

        return response.ok(payload)
    }

    /**
     * Crée une réponse d'erreur
     */
    static error(
        response: HttpContext['response'],
        message: string,
        statusCode: number = 500,
        errors?: Record<string, string[]>,
    ) {
        const payload: ApiErrorResponse = {
            status: 'error',
            message,
        }

        if (errors) {
            payload.errors = errors
        }

        return response.status(statusCode).json(payload)
    }

    /**
     * Crée une réponse créée (201)
     */
    static created<T>(
        response: HttpContext['response'],
        data: T,
        message: string = 'Resource created successfully',
    ) {
        return response.created({
            status: 'success',
            message,
            data,
        } as ApiSuccessResponse<T>)
    }

    /**
     * Crée une réponse non trouvée (404)
     */
    static notFound(response: HttpContext['response'], message: string = 'Resource not found') {
        return this.error(response, message, 404)
    }

    /**
     * Crée une réponse non autorisée (401)
     */
    static unauthorized(
        response: HttpContext['response'],
        message: string = 'Unauthorized',
    ) {
        return this.error(response, message, 401)
    }

    /**
     * Crée une réponse interdite (403)
     */
    static forbidden(response: HttpContext['response'], message: string = 'Forbidden') {
        return this.error(response, message, 403)
    }

    /**
     * Crée une réponse de validation (422)
     */
    static validationError(
        response: HttpContext['response'],
        message: string = 'Validation error',
        errors: Record<string, string[]>,
    ) {
        return this.error(response, message, 422, errors)
    }
}

