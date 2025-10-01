import { DateTime } from 'luxon'
import { Period } from '#types/period'

export function getRange(period: Period, zone = 'Africa/Kinshasa') {
    const now = DateTime.now().setZone(zone)

    switch (period) {
        case Period.Day:
            return { start: now.startOf('day'), end: now.endOf('day') }
        case Period.Week:
            return { start: now.startOf('week'), end: now.endOf('week') }
        case Period.Month:
            return { start: now.startOf('month'), end: now.endOf('month') }
        case Period.Year:
            return { start: now.startOf('year'), end: now.endOf('year') }
        default:
            throw new Error(`Période invalide: ${period}`)
    }
}

export function getExpiryRange(period: Period, offset = 1, zone = 'Africa/Kinshasa') {
    const now = DateTime.now().setZone(zone)

    switch (period) {
        case Period.Day:
            return { start: now, end: now.plus({ days: offset }) }
        case Period.Week:
            return { start: now, end: now.plus({ weeks: offset }) }
        case Period.Month:
            return { start: now, end: now.plus({ months: offset }) }
        case Period.Year:
            return { start: now, end: now.plus({ years: offset }) }
        default:
            throw new Error(`Période invalide: ${period}`)
    }
}
