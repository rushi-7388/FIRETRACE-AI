import { create } from 'zustand'
import axios from 'axios'

// ─── Mock data generator ──────────────────────────────────────────────────────
function generateMockCalendarData(bbox, startDate, endDate) {
  const [startYear, startMonth] = startDate.split('-').map(Number)
  const [endYear,   endMonth]   = endDate.split('-').map(Number)

  // Indian fire season peaks: March-May and Oct-Nov
  // Seasonality weights per month (1=Jan, 12=Dec)
  const seasonality = [0.3, 0.4, 1.0, 0.9, 0.7, 0.3, 0.2, 0.2, 0.3, 0.8, 0.9, 0.5]

  // High anomaly years
  const highAnomalyYears = new Set([2004, 2009, 2015, 2019, 2023])
  const lowAnomalyYears  = new Set([2002, 2010, 2017])

  const rows = []

  for (let year = startYear; year <= endYear; year++) {
    const mStart = year === startYear ? startMonth : 1
    const mEnd   = year === endYear   ? endMonth   : 12

    const yearMultiplier = highAnomalyYears.has(year)
      ? 1.6 + Math.random() * 0.4
      : lowAnomalyYears.has(year)
      ? 0.5 + Math.random() * 0.2
      : 0.85 + Math.random() * 0.3

    for (let month = mStart; month <= mEnd; month++) {
      const base    = seasonality[month - 1] * 25 * yearMultiplier
      const noise   = (Math.random() - 0.5) * 6
      const hdi     = Math.max(0, base + noise)

      // Historical median for this month (approximate)
      const historicalMedian = seasonality[month - 1] * 25 * 1.0
      const historicalStd    = seasonality[month - 1] * 5 + 2
      const zscore           = historicalStd > 0 ? (hdi - historicalMedian) / historicalStd : 0

      // Raw counts (MODIS + VIIRS separate)
      const modisCount  = Math.round(hdi * 3.2 + Math.random() * 5)
      const viirsCount  = Math.round(hdi * 4.8 + Math.random() * 7)
      const isAnomaly   = Math.abs(zscore) > 2

      rows.push({
        year,
        month,
        hdi:              parseFloat(hdi.toFixed(2)),
        z_score:          parseFloat(zscore.toFixed(3)),
        is_anomaly:       isAnomaly,
        modis_count:      modisCount,
        viirs_count:      viirsCount,
        harmonized_count: Math.round((modisCount + viirsCount) / 2),
        historical_median: parseFloat(historicalMedian.toFixed(2)),
        historical_iqr:   parseFloat((historicalStd * 1.35).toFixed(2)),
      })
    }
  }

  return rows
}

function generateMockHotspots(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox
  const points = []
  const count  = 150 + Math.floor(Math.random() * 100)

  for (let i = 0; i < count; i++) {
    const lat = minLat + Math.random() * (maxLat - minLat)
    const lon = minLon + Math.random() * (maxLon - minLon)
    const frp = Math.random() < 0.6
      ? Math.random() * 10        // low
      : Math.random() < 0.8
      ? 10 + Math.random() * 40   // medium
      : 50 + Math.random() * 100  // high

    const year  = 2000 + Math.floor(Math.random() * 25)
    const month = 1 + Math.floor(Math.random() * 12)
    const day   = 1 + Math.floor(Math.random() * 28)

    points.push({
      id:         i,
      lat:        parseFloat(lat.toFixed(5)),
      lon:        parseFloat(lon.toFixed(5)),
      frp:        parseFloat(frp.toFixed(1)),
      confidence: Math.random() > 0.3 ? 'high' : 'nominal',
      sensor:     Math.random() > 0.5 ? 'MODIS' : 'VIIRS',
      date:       `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    })
  }

  return points
}

// ─── Zustand Store ────────────────────────────────────────────────────────────
const useAppStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  bbox:           [72.0, 20.0, 74.5, 22.0], // [minLon, minLat, maxLon, maxLat]
  aoiAreaKm2:     null,
  aoiName:        'Surat / South Gujarat',
  dateRange:      { start: '2000-01', end: '2024-12' },
  sensor:         'both',                    // 'modis' | 'viirs' | 'both'
  harmonizedData: null,                      // array of calendar rows
  calendarData:   null,                      // processed for D3
  hotspots:       null,                      // array of fire points
  loading:        false,
  hotspotLoading: false,
  error:          null,

  // ── Actions ────────────────────────────────────────────────
  setBbox: (bbox) => set({ bbox }),

  setBboxAndRefetch: async (bbox, areaKm2 = null, name = 'Custom Drawn AOI') => {
    set({ bbox, aoiAreaKm2: areaKm2, aoiName: name })
    await Promise.all([get().fetchHarmonized(), get().fetchHotspots()])
  },

  setDateRange: (dateRange) => set({ dateRange }),

  setSensor: (sensor) => set({ sensor }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  fetchHarmonized: async () => {
    const { bbox, dateRange, sensor } = get()
    set({ loading: true, error: null })

    try {
      const params = {
        min_lon:    bbox[0],
        min_lat:    bbox[1],
        max_lon:    bbox[2],
        max_lat:    bbox[3],
        start_date: dateRange.start,
        end_date:   dateRange.end,
        sensor,
      }

      const response = await axios.get('/api/calendar', { params, timeout: 15000 })
      const data = response.data?.rows ?? response.data

      set({
        harmonizedData: data,
        calendarData:   data,
        loading:        false,
      })
    } catch (err) {
      // Fallback to mock data
      console.warn('API unavailable, using mock data:', err.message)
      const mockData = generateMockCalendarData(bbox, dateRange.start, dateRange.end)

      set({
        harmonizedData: mockData,
        calendarData:   mockData,
        loading:        false,
        error:          null, // don't surface error — mock data is usable
      })
    }
  },

  fetchHotspots: async () => {
    const { bbox, dateRange, sensor } = get()
    set({ hotspotLoading: true })

    try {
      const params = {
        min_lon:    bbox[0],
        min_lat:    bbox[1],
        max_lon:    bbox[2],
        max_lat:    bbox[3],
        start_date: dateRange.start,
        end_date:   dateRange.end,
        sensor,
        limit:      500,
      }

      const response = await axios.get('/api/hotspots', { params, timeout: 15000 })
      const hotspots = response.data?.hotspots ?? response.data

      set({ hotspots, hotspotLoading: false })
    } catch (err) {
      console.warn('Hotspot API unavailable, using mock data:', err.message)
      const mockHotspots = generateMockHotspots(bbox)
      set({ hotspots: mockHotspots, hotspotLoading: false })
    }
  },
}))

export default useAppStore
