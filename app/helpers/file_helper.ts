import type { Response } from '@adonisjs/core/http'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Télécharge un fichier PDF et nettoie le dossier temporaire après un délai
 * @param response - Réponse HTTP AdonisJS
 * @param pdfPath - Chemin du fichier PDF
 * @param filename - Nom du fichier à télécharger
 * @param cleanupDelay - Délai en millisecondes avant le nettoyage (défaut: 3000)
 * @param cleanupDir - Dossier à nettoyer (par défaut: dossier parent du PDF)
 */
export async function downloadPDF(
    response: Response,
    pdfPath: string,
    filename: string,
    cleanupDelay: number = 3000,
    cleanupDir?: string,
) {
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.type('application/pdf')
    await response.download(pdfPath)

    // Nettoyage automatique après le délai
    setTimeout(() => {
        const dirToClean = cleanupDir || path.dirname(pdfPath)
        try {
            fs.rmSync(dirToClean, { recursive: true, force: true })
        } catch (error) {
            console.error('Erreur lors du nettoyage du dossier temporaire:', error)
        }
    }, cleanupDelay)
}

/**
 * Télécharge un fichier Excel et nettoie le dossier temporaire après un délai
 * @param response - Réponse HTTP AdonisJS
 * @param filePath - Chemin du fichier Excel
 * @param filename - Nom du fichier à télécharger
 * @param cleanupDelay - Délai en millisecondes avant le nettoyage (défaut: 3000)
 */
export async function downloadExcel(
    response: Response,
    filePath: string,
    filename: string,
    cleanupDelay: number = 3000,
) {
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    await response.download(filePath)

    // Nettoyage automatique après le délai
    setTimeout(() => {
        try {
            fs.unlinkSync(filePath)
        } catch (error) {
            console.error('Erreur lors du nettoyage du fichier temporaire:', error)
        }
    }, cleanupDelay)
}

