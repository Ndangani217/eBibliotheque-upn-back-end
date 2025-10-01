// app/controllers/conducts_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Conduct from '#models/conduct'
import { createConductValidator, updateConductValidator } from '#validators/conduct'
import { ConductStatus } from '#types/conduct'
import { HandleError as handleError } from '#helpers/handleError'

export default class ConductsController {
    /**
     * Liste paginée de toutes les conduites
     */
    async index({ request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)

            const conducts = await Conduct.query()
                .preload('student')
                .preload('responsable')
                .orderBy('date', 'desc')
                .paginate(page, limit)

            conducts.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: 'Conduites récupérées avec succès',
                data: conducts,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération des conduites')
        }
    }

    /**
     * Récupérer une conduite par ID
     */
    async show({ params, response }: HttpContext) {
        try {
            const conduct = await Conduct.query()
                .where('id', params.id)
                .preload('student')
                .preload('responsable')
                .firstOrFail()

            return response.ok({
                status: 'success',
                message: 'Conduite récupérée avec succès',
                data: conduct,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la récupération de la conduite')
        }
    }

    /**
     * Créer une conduite
     */
    async store({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createConductValidator)
            const conduct = await Conduct.create(payload)

            return response.created({
                status: 'success',
                message: 'Conduite créée avec succès',
                data: conduct,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la création de la conduite')
        }
    }

    /**
     * Mettre à jour une conduite
     */
    async update({ params, request, response }: HttpContext) {
        try {
            const conduct = await Conduct.findOrFail(params.id)
            const payload = await request.validateUsing(updateConductValidator)

            conduct.merge(payload)
            await conduct.save()

            return response.ok({
                status: 'success',
                message: 'Conduite mise à jour avec succès',
                data: conduct,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la mise à jour de la conduite')
        }
    }

    /**
     * Supprimer une conduite
     */
    async destroy({ params, response }: HttpContext) {
        try {
            const conduct = await Conduct.findOrFail(params.id)
            await conduct.delete()

            return response.ok({
                status: 'success',
                message: 'Conduite supprimée avec succès',
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la suppression de la conduite')
        }
    }

    /**
     * Conduites d’un étudiant
     */
    async byStudent({ params, request, response }: HttpContext) {
        try {
            const page = request.input('page', 1)
            const limit = request.input('limit', 10)

            const conducts = await Conduct.query()
                .where('student_id', params.studentId)
                .preload('responsable')
                .orderBy('date', 'desc')
                .paginate(page, limit)

            conducts.baseUrl(request.url())

            return response.ok({
                status: 'success',
                message: `Conduites de l’étudiant ${params.studentId} récupérées`,
                data: conducts,
            })
        } catch (error) {
            return handleError(
                response,
                error,
                'Erreur lors de la récupération des conduites étudiant',
            )
        }
    }

    /**
     * Conduites par statut
     */
    async byStatus({ request, response }: HttpContext) {
        try {
            const status = request.input('status') as ConductStatus
            const page = request.input('page', 1)

            const conducts = await Conduct.query()
                .where('status', status)
                .preload('student')
                .preload('responsable')
                .orderBy('date', 'desc')
                .paginate(page, 10)

            return response.ok({
                status: 'success',
                message: `Conduites avec statut ${status}`,
                data: conducts,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors du filtre par statut')
        }
    }

    /**
     * Statistiques d’un étudiant
     */
    async statsByStudent({ params, response }: HttpContext) {
        try {
            const stats = await Conduct.query()
                .where('student_id', params.studentId)
                .count('* as total')
                .groupBy('type')

            return response.ok({
                status: 'success',
                message: `Statistiques des conduites de l’étudiant ${params.studentId}`,
                data: stats,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors des stats')
        }
    }

    /**
     * Clôturer une conduite
     */
    async close({ params, response }: HttpContext) {
        try {
            const conduct = await Conduct.findOrFail(params.id)
            conduct.status = ConductStatus.CLOSED
            await conduct.save()

            return response.ok({
                status: 'success',
                message: 'Conduite clôturée avec succès',
                data: conduct,
            })
        } catch (error) {
            return handleError(response, error, 'Erreur lors de la clôture')
        }
    }
}
