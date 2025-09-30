import cron from 'node-cron'
import Reservation from '#models/reservation'
import { ReservationStatus } from '#types/reservationStatus'
import { DateTime } from 'luxon'

cron.schedule('0 0 * * *', async () => {
    const now = DateTime.now()
    console.log(`[CRON] Vérification des réservations à ${now.toISO()}`)

    const reservations = await Reservation.query()
        .where('status', ReservationStatus.APPROUVEE)
        .whereNotNull('approved_at')

    for (const reservation of reservations) {
        if (!reservation.approvedAt) continue
        const deadline = reservation.approvedAt.plus({ days: 7 })

        if (now > deadline) {
            reservation.status = ReservationStatus.ANNULEE
            await reservation.save()
            console.log(`[CRON] Réservation ${reservation.id} annulée (délai dépassé)`)
        }
    }
})
