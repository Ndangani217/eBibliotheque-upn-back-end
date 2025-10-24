import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

interface PDFData {
    outputPath: string
    data: Record<string, any>
}

/* === Bon d’autorisation de paiement — UPN amélioré === */
export async function generateVoucherPDF({ outputPath, data }: PDFData) {
    const doc = new PDFDocument({ margin: 50 })
    await writePDFAsync(doc, outputPath, () => {
        // === En-tête complet ===
        header(doc, 'BON D’AUTORISATION DE PAIEMENT — eBibliothèque')

        // === Corps du document (marges ajustées) ===
        const bodyY = 200 // descend légèrement pour éviter le chevauchement du bandeau
        doc.roundedRect(45, bodyY, 520, 260, 10).lineWidth(1.3).stroke('#1e3a8a')
        doc.fontSize(12).fillColor('#111')

        const leftX = 70
        const valueX = 260
        const baseY = bodyY + 25
        const spacing = 25

        // === Données utilisateur ===
        const infos = [
            ['Nom complet :', data.fullName],
            ['Catégorie :', data.category],
            ['Durée :', `${data.duration} mois`],
            ['Banque :', data.bank || '—'],
            ['Montant à payer :', `${data.amount} USD`],
            ['Référence :', data.reference],
            [
                'Date et heure d’émission :',
                `${data.createdAt} à ${new Date().toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}`,
            ],
        ]

        infos.forEach(([label, value], i) => {
            doc.font('Helvetica-Bold').text(label, leftX, baseY + spacing * i)
            doc.font('Helvetica').text(value, valueX, baseY + spacing * i)
        })

        // === QR Code aligné à droite ===
        if (data.qrCodePath && fs.existsSync(data.qrCodePath)) {
            const qrY = bodyY + 10
            doc.roundedRect(395, qrY, 140, 150, 6).stroke('#d1d5db')
            doc.image(data.qrCodePath, 405, qrY + 10, { width: 120 })
            doc.fontSize(9)
                .fillColor('#555')
                .text('Code QR de vérification', 405, qrY + 135, { align: 'center', width: 120 })
        }

        // === Ligne décorative + bande d’instructions ===
        const footerY = bodyY + 250
        doc.moveTo(45, footerY).lineTo(565, footerY).strokeColor('#1e3a8a').stroke()
        doc.roundedRect(45, footerY + 10, 520, 60, 6).fill('#1e3a8a')
        doc.fillColor('#fff')
            .font('Helvetica')
            .fontSize(11)
            .text(
                'Présentez ce bon à la banque pour le paiement. Conservez soigneusement la référence et le code QR pour vérification par le gestionnaire de la bibliothèque numérique.',
                60,
                footerY + 25,
                { align: 'justify', width: 490 },
            )

        footer(doc)
    })
}

/* === Reçu de paiement (style harmonisé vert) === */
export async function generateReceiptPDF({ outputPath, data }: PDFData) {
    const doc = new PDFDocument({ margin: 50 })
    await writePDFAsync(doc, outputPath, () => {
        header(doc, 'REÇU DE PAIEMENT — eBibliothèque')

        const bodyY = 200
        doc.roundedRect(45, bodyY, 520, 260, 10).lineWidth(1.3).stroke('#16a34a')
        doc.fontSize(12).fillColor('#111')

        const leftX = 70
        const valueX = 260
        const baseY = bodyY + 25
        const spacing = 25

        const infos = [
            ['Nom complet :', data.fullName],
            ['Catégorie :', data.category],
            ['Durée :', `${data.duration} mois`],
            ['Montant payé :', `${data.amount} USD`],
            ['Banque :', data.bank || '—'],
            ['Référence :', data.reference],
            ['Transaction :', data.transactionId || '—'],
            ['Date du paiement :', data.paymentDate || '—'],
        ]

        infos.forEach(([label, value], i) => {
            doc.font('Helvetica-Bold').text(label, leftX, baseY + spacing * i)
            doc.font('Helvetica').text(value, valueX, baseY + spacing * i)
        })

        if (data.qrCodePath && fs.existsSync(data.qrCodePath)) {
            const qrY = bodyY + 10
            doc.roundedRect(395, qrY, 140, 150, 6).stroke('#d1d5db')
            doc.image(data.qrCodePath, 405, qrY + 10, { width: 120 })
            doc.fontSize(9)
                .fillColor('#555')
                .text('Code QR de vérification', 405, qrY + 135, { align: 'center', width: 120 })
        }

        const footerY = bodyY + 300
        doc.moveTo(45, footerY).lineTo(565, footerY).strokeColor('#16a34a').stroke()
        doc.roundedRect(45, footerY + 10, 520, 60, 6).fill('#16a34a')
        doc.fillColor('#fff')
            .font('Helvetica')
            .fontSize(11)
            .text(
                'Paiement confirmé et validé par le système eBibliothèque. Veuillez conserver ce reçu comme preuve officielle de transaction.',
                60,
                footerY + 25,
                { align: 'justify', width: 490 },
            )

        footer(doc)
    })
}

/* === Écriture du PDF === */
function writePDFAsync(doc: PDFKit.PDFDocument, outputPath: string, contentFn: () => void) {
    return new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(outputPath)
        doc.pipe(stream)
        try {
            contentFn()
        } catch (err) {
            reject(err)
        }
        doc.end()
        stream.on('finish', () => {
            console.log(`PDF généré avec succès : ${outputPath}`)
            resolve()
        })
        stream.on('error', reject)
    })
}

/* === En-tête officiel UPN (espacement ajusté et logo centré) === */
function header(doc: PDFKit.PDFDocument, title: string) {
    const logoPath = path.resolve('public/logo-upn.png')
    const hasLogo = fs.existsSync(logoPath)

    // === Logo centré ===
    if (hasLogo) {
        doc.image(logoPath, 270, 45, { width: 70 })
    }

    // === Texte institutionnel équilibré ===
    const baseY = 130
    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#000')
        .text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', 0, baseY, { align: 'center' })
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(9)
        .text('Ministère de l’Enseignement Supérieur et Universitaire', { align: 'center' })
        .moveDown(0.2)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('UNIVERSITÉ PÉDAGOGIQUE NATIONALE (UPN)', { align: 'center' })
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555')
        .text('Direction du Service Numérique — eBibliothèque', { align: 'center' })

    // === Bandeau bleu (descendu légèrement pour ne pas coller au texte) ===
    const bandY = 170
    doc.roundedRect(45, bandY, 520, 25, 5).fill('#1e3a8a')
    doc.fillColor('#fff')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(title, 0, bandY + 6, { align: 'center' })

    // Ligne de séparation sous le bandeau
    doc.moveTo(45, bandY + 25)
        .lineTo(565, bandY + 25)
        .strokeColor('#1e3a8a')
        .stroke()
}

/* === Pied de page harmonisé === */
function footer(doc: PDFKit.PDFDocument) {
    const footerY = 650

    doc.fontSize(9)
        .fillColor('#555')
        .text(
            'Université Pédagogique Nationale — Document généré automatiquement par le système eBibliothèque',
            50,
            footerY,
            { align: 'center', width: 500 },
        )

    doc.fontSize(9)
        .fillColor('#1e3a8a')
        .text('« La digitalisation en marche — eBibliothèque UPN »', 0, footerY + 20, {
            align: 'center',
        })
}
