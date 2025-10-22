import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

interface PDFData {
    outputPath: string
    data: Record<string, any>
}

/* === Bon de paiement === */
export async function generateVoucherPDF({ outputPath, data }: PDFData) {
    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(fs.createWriteStream(outputPath))

    header(doc, 'BON DE PAIEMENT — eBibliothèque')

    doc.moveDown(2).fontSize(11).fillColor('#000')
    doc.text(`Nom complet : ${data.fullName}`)
    doc.text(`Catégorie : ${data.category}`)
    doc.text(`Durée : ${data.duration} mois`)
    doc.text(`Banque : ${data.bank}`)
    doc.text(`Montant à payer : ${data.amount} USD`)
    doc.text(`Référence : ${data.reference}`)
    doc.text(`Date d’émission : ${data.createdAt}`)

    doc.moveDown(2)
    doc.fillColor('#1e3a8a')
        .fontSize(10)
        .text('Présentez ce bon à la banque pour le paiement. Conservez la référence du bon.', {
            align: 'center',
        })

    footer(doc)
    doc.end()
}

/* === Reçu de paiement === */
export async function generateReceiptPDF({ outputPath, data }: PDFData) {
    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(fs.createWriteStream(outputPath))

    header(doc, 'REÇU DE PAIEMENT — eBibliothèque')

    doc.moveDown(2).fontSize(11).fillColor('#000')
    doc.text(`Nom complet : ${data.fullName}`)
    doc.text(`Catégorie : ${data.category}`)
    doc.text(`Durée : ${data.duration} mois`)
    doc.text(`Montant payé : ${data.amount} USD`)
    doc.text(`Banque : ${data.bank}`)
    doc.text(`Référence du bon : ${data.reference}`)
    doc.text(`Transaction : ${data.transactionId}`)
    doc.text(`Date du paiement : ${data.paymentDate}`)

    doc.moveDown(2)
    doc.fillColor('#16a34a')
        .fontSize(11)
        .text('Paiement confirmé et validé par le système eBibliothèque.', { align: 'center' })

    footer(doc)
    doc.end()
}

/* === Fonctions partagées === */
function header(doc: PDFKit.PDFDocument, title: string) {
    const logoPath = path.resolve('public/logo-upn.png')
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 40, { width: 60 })
    doc.fontSize(16).fillColor('#1e3a8a').text('Université Pédagogique Nationale', 120, 50)
    doc.fontSize(11).fillColor('#444').text('Direction du Service Numérique — eBibliothèque')
    doc.moveDown(2)
    doc.fontSize(14).fillColor('#1e3a8a').text(title, { align: 'center', underline: true })
}

function footer(doc: PDFKit.PDFDocument) {
    doc.moveDown(4)
    doc.fontSize(9)
        .fillColor('#555')
        .text(
            'Université Pédagogique Nationale — Document généré automatiquement par le système eBibliothèque',
            { align: 'center' },
        )
}
