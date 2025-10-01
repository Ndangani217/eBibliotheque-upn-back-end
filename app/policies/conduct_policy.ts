import User from '#models/user'
import Conduct from '#models/conduct'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { Role } from '#types/role'
import { ConductStatus } from '#types/conduct'

export default class ConductPolicy extends BasePolicy {
    /**
     * Seul ADMIN et MANAGER peuvent créer
     */
    async create(user: User): Promise<AuthorizerResponse> {
        return [Role.ADMIN, Role.MANAGER].includes(user.role)
    }

    /**
     * Seul ADMIN et MANAGER peuvent modifier
     */
    async update(user: User): Promise<AuthorizerResponse> {
        return [Role.ADMIN, Role.MANAGER].includes(user.role)
    }

    /**
     * Seul ADMIN peut supprimer
     */
    async delete(user: User): Promise<AuthorizerResponse> {
        return user.role === Role.ADMIN
    }

    /**
     * Tout utilisateur connecté peut voir ses propres conduites
     */
    async view(user: User, conduct: Conduct): Promise<AuthorizerResponse> {
        if ([Role.ADMIN, Role.MANAGER].includes(user.role)) {
            return true
        }
        return conduct.studentId === user.id
    }

    /**
     * (Optionnel) Autoriser la clôture si pas déjà clos
     */
    async close(user: User, conduct: Conduct): Promise<AuthorizerResponse> {
        return (
            [Role.ADMIN, Role.MANAGER].includes(user.role) &&
            conduct.status !== ConductStatus.CLOSED
        )
    }
}
