export function getCambodiaDateTimeLocal() {
  const now = new Date()

  const cambodia = new Date(
    now.toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh'
    })
  )

  const year = cambodia.getFullYear()
  const month = String(cambodia.getMonth() + 1).padStart(2, '0')
  const day = String(cambodia.getDate()).padStart(2, '0')
  const hours = String(cambodia.getHours()).padStart(2, '0')
  const minutes = String(cambodia.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Cambodia (Asia/Phnom_Penh) is a fixed UTC+7 offset, no DST.
const PP_OFFSET_MS = 7 * 60 * 60000

export function pad(n) { return String(n).padStart(2, '0') }

// Detects whether a string carries explicit timezone info (Z or ±HH:MM)
function hasTZMarker(s) {
  return /Z$|[+-]\d{2}:?\d{2}$/.test(s.trim())
}

// Current Phnom Penh wall-clock time as component parts
function ppNowParts() {
  const pp = new Date(Date.now() + PP_OFFSET_MS)
  return {
    y: pp.getUTCFullYear(), mo: pp.getUTCMonth(), d: pp.getUTCDate(),
    h: pp.getUTCHours(), mi: pp.getUTCMinutes(), s: pp.getUTCSeconds(),
  }
}

/**
 * Current Phnom Penh time formatted for <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
 */
export function nowForDatetimeInput() {
  const { y, mo, d, h, mi } = ppNowParts()
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}`
}

/**
 * Current Phnom Penh time formatted for the custom DatePicker.vue component
 * ("YYYY-MM-DD HH:mm:ss"). Replaces the old duplicated currentDateTime().
 */
export function nowForDatePicker() {
  const { y, mo, d, h, mi, s } = ppNowParts()
  return `${y}-${pad(mo + 1)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(s)}`
}

/**
 * Converts an API date value to a string for <input type="datetime-local">,
 * representing Phnom Penh local wall-clock time.
 * - If val carries a timezone marker (Z / ±HH:MM) it's a real instant -> convert to PP time.
 * - If val is naive (no marker) it's already local -> use digits as-is, no conversion.
 */
export function toDatetimeInputValue(val) {
  if (!val) return ''

  if (hasTZMarker(val)) {
    const instant = new Date(val)
    const pp = new Date(instant.getTime() + PP_OFFSET_MS)
    return `${pp.getUTCFullYear()}-${pad(pp.getUTCMonth() + 1)}-${pad(pp.getUTCDate())}T${pad(pp.getUTCHours())}:${pad(pp.getUTCMinutes())}`
  }

  // Naive string, e.g. "2026-07-06 09:24:51" or "2026-07-06T09:24:51" - already local
  const [datePart, timePart = '00:00'] = val.replace('T', ' ').split(' ')
  const [hh, mm] = timePart.split(':')
  return `${datePart}T${pad(Number(hh))}:${pad(Number(mm))}`
}

/**
 * Converts a <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") to the
 * naive "YYYY-MM-DD HH:mm:ss" string the backend expects (Phnom Penh local time).
 */
export function fromDatetimeInputValue(val) {
  if (!val) return ''
  return val.replace('T', ' ') + ':00'
}