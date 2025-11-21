import type { HttpContext } from '@adonisjs/core/http'
import ActivityLog from '#models/activity_log'

type LogOptions = {
  entityType?: string
  entityId?: string | number
  metadata?: Record<string, unknown>
}

export class ActivityLogger {
  static async log(ctx: HttpContext, action: string, options: LogOptions = {}) {
    const user = ctx.auth?.user
    try {
      await ActivityLog.create({
        userId: user?.id ?? 'anonymous',
        role: user?.role ?? 'anonymous',
        action,
        entityType: options.entityType ?? null,
        entityId: options.entityId ? String(options.entityId) : null,
        metadata: options.metadata ?? null,
        ipAddress: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent') ?? null,
      })
    } catch (err) {
      // fail-safe: ne bloque pas l'action principale
      ctx.logger?.error({ err }, '[ActivityLogger] Unable to write activity log')
    }
  }
}


