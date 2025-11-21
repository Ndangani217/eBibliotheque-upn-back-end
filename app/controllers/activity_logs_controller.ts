import type { HttpContext } from '@adonisjs/core/http'
import ActivityLog from '#models/activity_log'

export default class ActivityLogsController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({ message: 'Non authentifié' })
      }

      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 10))
      const action = request.input('action') as string | undefined
      const role = request.input('role') as string | undefined

      const query = ActivityLog.query().orderBy('created_at', 'desc')
      if (user.role !== 'admin') {
        query.where('user_id', user.id)
      } else {
        if (role) query.where('role', role)
        if (action) query.whereILike('action', `%${action}%`)
      }

      const paginated = await query.paginate(page, limit)
      return response.ok({
        status: 'success',
        data: paginated.toJSON().data,
        meta: paginated.getMeta(),
      })
    } catch (error) {
      return response.status(500).json({ status: 'error', message: 'Erreur lors du chargement des journaux' })
    }
  }
}


