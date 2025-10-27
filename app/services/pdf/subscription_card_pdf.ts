import PDFDocument from 'pdfkit'
import fs from 'node:fs'

interface PDFData {
    outputPath: string
    data: {
        fullName: string
        email: string
        phoneNumber: string
        category: string
        startDate: string
        endDate: string
        reference: string
        qrCodePath: string
    }
}

/**
 *  Génère une carte d’abonnement professionnelle pour eBibliothèque UPN
 */
export async function generateSubscriptionCardPDF({ outputPath, data }: PDFData) {
    const doc = new PDFDocument({ size: [400, 250], margin: 20 })

    await new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(outputPath)
        doc.pipe(stream)

        try {
            // ==== Fond principal ====
            doc.rect(0, 0, 400, 250).fill('#f8fafc') // gris très clair
            doc.rect(0, 0, 400, 60).fill('#1e3a8a') // bande bleue haut UPN

            // ==== En-tête ====
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('eBIBLIOTHÈQUE UPN', 20, 20)
            doc.font('Helvetica').fontSize(9).text('Université Pédagogique Nationale', 22, 38)

            // ==== Bloc d’information ====
            const infoX = 25
            let infoY = 85
            const lineGap = 20

            doc.fillColor('#111').font('Helvetica').fontSize(11)
            doc.text(`Nom complet : ${data.fullName}`, infoX, infoY)
            doc.text(`Adresse e-mail : ${data.email}`, infoX, (infoY += lineGap))
            doc.text(`Téléphone : ${data.phoneNumber}`, infoX, (infoY += lineGap))
            doc.text(`Catégorie : ${formatCategory(data.category)}`, infoX, (infoY += lineGap))
            doc.text(`Période : du ${data.startDate} au ${data.endDate}`, infoX, (infoY += lineGap))
            doc.text(`Référence : ${data.reference}`, infoX, (infoY += lineGap))

            // ==== QR code ====
            if (data.qrCodePath && fs.existsSync(data.qrCodePath)) {
                doc.roundedRect(290, 90, 85, 85, 6).stroke('#cbd5e1')
                doc.image(data.qrCodePath, 295, 95, { width: 75 })
                doc.fontSize(8)
                    .fillColor('#475569')
                    .text('Vérification en ligne', 290, 185, { align: 'center', width: 85 })
            }

            // ==== Footer institutionnel ====
            doc.rect(0, 220, 400, 30).fill('#1e3a8a')
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Université Pédagogique Nationale — eBibliothèque UPN', 0, 230, {
                    align: 'center',
                })
            doc.fontSize(8)
                .fillColor('#e0e7ff')
                .text('« La digitalisation en marche »', { align: 'center' })

            doc.end()
            stream.on('finish', () => resolve())
            stream.on('error', reject)
        } catch (err) {
            reject(err)
        }
    })
}

/**Traduction et formatage de la catégorie */
function formatCategory(category: string): string {
    if (!category) return '—'
    switch (category.toLowerCase()) {
        case 'student':
            return 'Étudiant'
        case 'researcher':
            return 'Chercheur'
        default:
            return category
    }
}
