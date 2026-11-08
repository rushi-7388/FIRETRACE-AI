import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Brush, Legend, Area, ComposedChart, ResponsiveContainer,
} from 'recharts'
import useAppStore from '../../store/useAppStore.js'
import { formatDate, formatHDI, formatZScore } from '../../utils/format.js'
import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0]?.payload ?? {}

  return (
    <div className="bg-bg-card border border-border-muted rounded-lg p-3 text-xs shadow-xl min-w-[180px]">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-text-primary">{p.value != null ? p.value.toFixed(2) : '-'}</span>
        </div>
      ))}
      {data.is_anomaly && (
        <div className="mt-2 pt-1.5 border-t border-border-muted text-cyan-400 font-semibold">
          ⚡ Anomaly  {formatZScore(data.z_score)}
        </div>
      )}
      {data.z_score != null && !data.is_anomaly && (
        <div className="mt-1 text-text-muted">
          Z-score: {formatZScore(data.z_score)}
        </div>
      )}
    </div>
  )
}

// ─── Peak Year Reference Lines ─────────────────────────────────────────────────
const PEAK_YEARS = [2004, 2009, 2015, 2019, 2023]

// ─── TimeSeriesChart ──────────────────────────────────────────────────────────
export default function TimeSeriesChart() {
  const calendarData = useAppStore(s => s.calendarData)
  const loading = useAppStore(s => s.loading)

  const chartData = useMemo(() => {
    if (!calendarData) return []

    return calendarData.map(d => ({
      label: formatDate(d.year, d.month),
      year: d.year,
      month: d.month,
      harmonized: d.hdi,
      modis: d.modis_count != null ? +(d.modis_count / 5).toFixed(2) : null,
      viirs: d.viirs_count != null ? +(d.viirs_count / 5).toFixed(2) : null,
      medianLow: d.historical_median != null
        ? Math.max(0, d.historical_median - (d.historical_iqr ?? 3))
        : null,
      medianHigh: d.historical_median != null
        ? d.historical_median + (d.historical_iqr ?? 3)
        : null,
      z_score: d.z_score,
      is_anomaly: d.is_anomaly,
    }))
  }, [calendarData])

  // Build peak reference lines on year boundaries
  const peakLabels = useMemo(() => {
    if (!chartData.length) return []
    return chartData
      .filter(d => d.month === 4 && PEAK_YEARS.includes(d.year))
      .map(d => d.label)
  }, [chartData])

  if (loading) {
    return <div className="skeleton h-52 w-full rounded-lg" />
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        <TrendingUp size={20} className="mr-2 text-border-muted" />
        No data loaded yet
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={15} className="text-ember" />
          Hotspot Density Index - Time Series
        </h3>
        <div className="flex gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block bg-blue-400" /> MODIS</span>
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block bg-orange-400" /> VIIRS</span>
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block bg-white" /> Harmonized</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />

          {/* Historical median band */}
          <Area
            dataKey="medianHigh"
            stroke="none"
            fill="#30363D"
            fillOpacity={0.5}
            dot={false}
            activeDot={false}
            legendType="none"
            name="Hist. IQR High"
          />
          <Area
            dataKey="medianLow"
            stroke="none"
            fill="#0D1117"
            fillOpacity={1}
            dot={false}
            activeDot={false}
            legendType="none"
            name="Hist. IQR Low"
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#7D8590' }}
            tickLine={false}
            interval={Math.ceil(chartData.length / 16)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7D8590' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Peak year reference lines */}
          {peakLabels.map(label => (
            <ReferenceLine
              key={label}
              x={label}
              stroke="#FF4500"
              strokeDasharray="4 3"
              strokeOpacity={0.5}
              label={{ value: label.split(' ')[1], fill: '#FF4500', fontSize: 9, position: 'top' }}
            />
          ))}

          <Line dataKey="modis" name="MODIS" stroke="#60A5FA" strokeWidth={1.2} dot={false} connectNulls />
          <Line dataKey="viirs" name="VIIRS" stroke="#FB923C" strokeWidth={1.2} dot={false} connectNulls />
          <Line dataKey="harmonized" name="Harmonized" stroke="#FFFFFF" strokeWidth={2} dot={false} connectNulls />

          <Brush
            dataKey="label"
            height={20}
            travellerWidth={8}
            stroke="#30363D"
            fill="#161B22"
            travellerStyle={{ fill: '#FF4500' }}
            tickFormatter={() => ''}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
