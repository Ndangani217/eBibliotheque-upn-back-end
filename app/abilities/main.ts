/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import { Bouncer } from '@adonisjs/bouncer'
import User from '#models/user'
import { Role } from '../types/role/index.js'

/**
 * Delete the following ability to start from
 * scratch
 */
function userHasRole(user: User, roles: Role[]) {
    return roles.includes(user.role)
}

/**
 * Abilities spécifiques
 */
export const isAdmin = Bouncer.ability((user: User) => userHasRole(user, [Role.ADMIN]))
export const isManager = Bouncer.ability((user: User) => userHasRole(user, [Role.MANAGER]))
export const isStudent = Bouncer.ability((user: User) => userHasRole(user, [Role.STUDENT]))
export const adminOrManager = Bouncer.ability((user: User) =>
    userHasRole(user, [Role.ADMIN, Role.MANAGER]),
)

/**
 * Ability générique pour passer un tableau de rôles
 */
export const hasRoleAbility = Bouncer.ability((user: User, roles: Role[]) =>
    userHasRole(user, roles),
)
