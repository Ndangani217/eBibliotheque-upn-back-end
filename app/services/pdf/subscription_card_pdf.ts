import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

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
 *  Génère une carte d'abonnement professionnelle pour eBibliothèque UPN
 */
export async function generateSubscriptionCardPDF({ outputPath, data }: PDFData) {
    // Taille de la carte en points (1 point = 1/72 inch)
    // 400x250 points ≈ 14.1 x 8.8 cm (taille carte de crédit)
    const cardWidth = 400
    const cardHeight = 250
    const doc = new PDFDocument({ 
        size: [cardWidth, cardHeight], 
        margin: 0,
        bufferPages: true // Activer le buffer pour contrôler les pages
    })

    await new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(outputPath)
        doc.pipe(stream)

        try {
            // ==== Fond principal ====
            doc.rect(0, 0, cardWidth, cardHeight).fill('#f8fafc') // gris très clair
            doc.rect(0, 0, cardWidth, 60).fill('#1e3a8a') // bande bleue haut UPN

            // ==== En-tête ====
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('eBIBLIOTHÈQUE UPN', 20, 20)
            doc.font('Helvetica').fontSize(9).text('Université Pédagogique Nationale', 22, 38)

            // ==== Logo UPN en haut à droite ====
            const logoPath = path.resolve('public/logo-upn.png')
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 300, 10, { width: 80, height: 40, fit: [80, 40] })
            }

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

            // ==== QR code ====
            if (data.qrCodePath && fs.existsSync(data.qrCodePath)) {
                doc.roundedRect(290, 90, 85, 85, 6).stroke('#cbd5e1')
                doc.image(data.qrCodePath, 295, 95, { width: 75 })
                doc.fontSize(8)
                    .fillColor('#475569')
                    .text('Vérification en ligne', 290, 185, { align: 'center', width: 85 })
            }

            // ==== Footer institutionnel ====
            doc.rect(0, 220, cardWidth, 30).fill('#1e3a8a')
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Université Pédagogique Nationale — eBibliothèque UPN', 0, 228, {
                    align: 'center',
                    width: cardWidth
                })
            doc.fontSize(8)
                .fillColor('#e0e7ff')
                .text('« La digitalisation en marche »', 0, 240, { 
                    align: 'center',
                    width: cardWidth
                })

            // ==== Signature officielle UPN ====
            doc.fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .fontSize(7)
                .text('Signature officielle UPN', 0, 200, {
                    align: 'center',
                    width: cardWidth
                })
            doc.font('Helvetica')
                .fontSize(6)
                .fillColor('#475569')
                .text('Université Pédagogique Nationale', 0, 210, {
                    align: 'center',
                    width: cardWidth
                })

            // S'assurer qu'on n'a qu'une seule page
            // PDFKit peut créer des pages supplémentaires automatiquement
            // On s'assure de rester sur la première page avant de finaliser
            const pageRange = doc.bufferedPageRange()
            if (pageRange && pageRange.count > 1) {
                // Si plusieurs pages ont été créées, on revient à la première
                doc.switchToPage(0)
            }

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
