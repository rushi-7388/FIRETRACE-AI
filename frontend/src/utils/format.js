// ─── Month names ──────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const MONTH_SINGLE = [
  'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D',
]

// ─── formatDate ───────────────────────────────────────────────────────────────
/**
 * Returns a human-readable month-year string.
 * @param {number} year  e.g. 2024
 * @param {number} month 1-based, e.g. 1 → "Jan 2024"
 */
export function formatDate(year, month) {
  const abbrev = MONTH_ABBREVS[(month - 1) % 12] ?? 'Jan'
  return `${abbrev} ${year}`
}

// ─── formatDateISO ────────────────────────────────────────────────────────────
/**
 * Returns "YYYY-MM" string.
 */
export function formatDateISO(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

// ─── formatHDI ────────────────────────────────────────────────────────────────
/**
 * Returns HDI formatted to one decimal place.
 */
export function formatHDI(value) {
  if (value == null || isNaN(value)) return '-'
  return value.toFixed(1)
}

// ─── formatZScore ─────────────────────────────────────────────────────────────
/**
 * Returns z-score with sign and σ symbol, e.g. "+2.3σ".
 */
export function formatZScore(z) {
  if (z == null || isNaN(z)) return '-'
  const sign = z >= 0 ? '+' : ''
  return `${sign}${z.toFixed(2)}σ`
}

// ─── monthName ────────────────────────────────────────────────────────────────
/**
 * Returns the full month name for a 1-based month number.
 */
export function monthName(num) {
  return MONTH_NAMES[(num - 1) % 12] ?? 'January'
}

// ─── monthAbbrev ─────────────────────────────────────────────────────────────
export function monthAbbrev(num) {
  return MONTH_ABBREVS[(num - 1) % 12] ?? 'Jan'
}

// ─── monthSingle ─────────────────────────────────────────────────────────────
export function monthSingle(num) {
  return MONTH_SINGLE[(num - 1) % 12] ?? 'J'
}

// ─── formatNumber ─────────────────────────────────────────────────────────────
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '-'
  return n.toLocaleString('en-IN')
}

// ─── formatPercent ────────────────────────────────────────────────────────────
export function formatPercent(n) {
  if (n == null || isNaN(n)) return '-'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}
