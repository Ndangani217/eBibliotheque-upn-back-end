import type { HttpContext } from '@adonisjs/core/http'
import Mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class TestMailController {
    async send({ response }: HttpContext) {
        try {
            await Mail.use('smtp').send((message) => {
                message
                    .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME')!)
                    .to('heritierndangani217@gmail.com')
                    .subject('🚀 Test envoi email AdonisJS')
                    .html('<h1>Hello depuis AdonisJS avec Mailtrap</h1>')
            })

            return response.ok({ status: 'success', message: 'Email envoyé avec succès' })
        } catch (error) {
            console.error('Erreur mail:', error)
            return response.internalServerError({ status: 'error', message: 'Échec envoi email' })
        }
    }
}
