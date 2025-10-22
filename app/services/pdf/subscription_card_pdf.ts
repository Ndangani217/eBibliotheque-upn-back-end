import PDFDocument from 'pdfkit'
import fs from 'node:fs'

export async function generateSubscriptionCardPDF({ outputPath, data }: any) {
    const doc = new PDFDocument({ size: [350, 220], margin: 20 })
    doc.pipe(fs.createWriteStream(outputPath))
    doc.rect(0, 0, 350, 220).fill('#f0f4ff')
    doc.fillColor('#1e3a8a').fontSize(16).text('CARTE D’ABONNEMENT', { align: 'center' })
    doc.moveDown(1)

    doc.fontSize(11).fillColor('#000')
    doc.text(`Nom complet : ${data.fullName}`)
    doc.text(`Catégorie : ${data.category}`)
    doc.text(`Référence : ${data.reference}`)
    doc.text(`Valide du ${data.startDate} au ${data.endDate}`)

    if (data.qrPath) {
        doc.image(data.qrPath, 250, 80, { width: 70 })
    }

    doc.moveDown(2)
    doc.fontSize(9)
        .fillColor('#666')
        .text('Université Pédagogique Nationale — Bibliothèque numérique', { align: 'center' })

    doc.end()
}
