import type { HttpContext } from '@adonisjs/core/http'
import type { Response } from '@adonisjs/core/http'

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns L'utilisateur authentifié ou null si non authentifié
 */
export function getAuthenticatedUser(auth: HttpContext['auth'], response: Response) {
    const user = auth.user
    if (!user) {
        response.unauthorized({ message: 'Utilisateur non authentifié.' })
        return null
    }
    return user
}

