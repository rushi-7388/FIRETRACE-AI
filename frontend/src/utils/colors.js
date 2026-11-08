// ─── YlOrRd Color Scale Constants ────────────────────────────────────────────
export const YL_OR_RD = [
  '#FFFFCC',
  '#FFEDA0',
  '#FED976',
  '#FEB24C',
  '#FD8D3C',
  '#FC4E2A',
  '#E31A1C',
  '#BD0026',
  '#800026',
]

// ─── hdiToColor ───────────────────────────────────────────────────────────────
/**
 * Maps an HDI value to a color string using a YlOrRd-like scale.
 * @param {number} hdi   - Current cell HDI value
 * @param {number} maxHdi - Maximum HDI in the dataset
 * @returns {string} Hex color
 */
export function hdiToColor(hdi, maxHdi) {
  if (hdi == null || isNaN(hdi) || maxHdi === 0) return '#2D2D2D'

  const t = Math.min(1, Math.max(0, hdi / maxHdi))

  if (t === 0)      return '#2D2D2D'  // No data / zero
  if (t < 0.0001)   return '#2D2D2D'

  // Map t → index in YL_OR_RD
  const idx = Math.floor(t * (YL_OR_RD.length - 1))
  const lo  = YL_OR_RD[idx]
  const hi  = YL_OR_RD[Math.min(idx + 1, YL_OR_RD.length - 1)]

  // Interpolate between lo and hi
  const frac = t * (YL_OR_RD.length - 1) - idx
  return lerpColor(lo, hi, frac)
}

// ─── hdiToColorPercentile ─────────────────────────────────────────────────────
/**
 * Maps an HDI percentile (0–1) to a color.
 */
export function hdiToColorPercentile(percentile) {
  if (percentile == null || isNaN(percentile)) return '#2D2D2D'
  if (percentile <= 0) return '#2D2D2D'

  const t   = Math.min(1, Math.max(0, percentile))
  const idx = Math.floor(t * (YL_OR_RD.length - 1))
  const lo  = YL_OR_RD[idx]
  const hi  = YL_OR_RD[Math.min(idx + 1, YL_OR_RD.length - 1)]
  const frac = t * (YL_OR_RD.length - 1) - idx
  return lerpColor(lo, hi, frac)
}

// ─── zscoreToColor ────────────────────────────────────────────────────────────
/**
 * Maps a Z-score to a semantic color:
 *  < -2  : deep blue   (#1D6FA5)
 *  -2–-1 : blue-green  (#41B6C4)
 *  -1–0  : light green (#A8DDB5)
 *   0–1  : yellow      (#FFFFB2)
 *   1–2  : orange      (#FEB24C)
 *   2–3  : red-orange  (#FC4E2A)
 *   > 3  : dark red    (#800026)
 */
export function zscoreToColor(z) {
  if (z == null || isNaN(z)) return '#7D8590'

  if (z < -2)      return '#1D6FA5'
  if (z < -1)      return '#41B6C4'
  if (z < 0)       return '#A8DDB5'
  if (z < 1)       return '#FFFFB2'
  if (z < 2)       return '#FEB24C'
  if (z < 3)       return '#FC4E2A'
  return '#800026'
}

// ─── frpToColor ───────────────────────────────────────────────────────────────
/**
 * Maps FRP (Fire Radiative Power in MW) to a color.
 *  Low   (<10 MW)  : yellow #FFD700
 *  Med   (10–50)   : orange #FF8C00
 *  High  (>50 MW)  : red    #FF0000
 */
export function frpToColor(frp) {
  if (frp == null || isNaN(frp)) return '#FFD700'
  if (frp < 10)  return '#FFD700'
  if (frp < 50)  return '#FF8C00'
  return '#FF0000'
}

// ─── frpToRadius ─────────────────────────────────────────────────────────────
export function frpToRadius(frp) {
  if (frp == null || isNaN(frp)) return 4
  if (frp < 10)  return 4
  if (frp < 50)  return 6
  if (frp < 150) return 8
  return 11
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('')
}

function lerpColor(hex1, hex2, t) {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}
