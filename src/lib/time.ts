// Single source of truth for how this app interprets and displays event times.
//
// The whole platform operates in one timezone (a Kerala student org), so every
// date the admin picks and every date a student sees is India Standard Time,
// regardless of where the server runs or where the viewer happens to be. Pinning
// the zone here keeps write and read symmetric: "9:00 AM" entered in the manage
// form shows as "9:00 AM" everywhere.

export const APP_TIMEZONE = 'Asia/Kolkata'

// Offset (minutes) of APP_TIMEZONE from UTC at a given instant. Positive means
// ahead of UTC (IST is +330). Derived from Intl so it stays correct even if the
// zone ever observed DST — it doesn't today, but this avoids a magic constant.
function zoneOffsetMinutes(at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(at)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  // What wall-clock APP_TIMEZONE shows for this instant, read back as if UTC.
  const asUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second')
  )
  return (asUTC - at.getTime()) / 60000
}

// Convert a wall-clock `YYYY-MM-DDTHH:mm` (the datetime-local / DateTimePicker
// wire format, no zone) that MEANS a time in APP_TIMEZONE into the correct UTC
// ISO instant. Deterministic across server timezones — unlike `new Date(str)`,
// which parses the string in the server's local zone.
export function appLocalToISO(wallClock: string): string {
  // Treat the parts as if they were UTC, then subtract the zone offset for that
  // approximate instant to land on the true UTC time.
  const asIfUTC = new Date(`${wallClock}Z`)
  if (Number.isNaN(asIfUTC.getTime())) {
    // Fall back to native parsing rather than throwing on unexpected input.
    return new Date(wallClock).toISOString()
  }
  const offsetMin = zoneOffsetMinutes(asIfUTC)
  return new Date(asIfUTC.getTime() - offsetMin * 60000).toISOString()
}
