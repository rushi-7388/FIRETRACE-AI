import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer, LabelList,
} from 'recharts'
import useAppStore from '../../store/useAppStore.js'
import { zscoreToColor } from '../../utils/colors.js'
import { monthAbbrev, formatZScore } from '../../utils/format.js'
import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function AnomalyTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0]?.payload ?? {}

  return (
    <div className="bg-bg-card border border-border-muted rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      <p>
        Z-Score:{' '}
        <span
          className="font-mono font-semibold"
          style={{ color: zscoreToColor(d.z_score) }}
        >
          {formatZScore(d.z_score)}
        </span>
      </p>
      <p className="text-text-muted mt-1">HDI: {d.hdi?.toFixed(2) ?? '-'}</p>
      {d.is_anomaly && (
        <p className="text-cyan-400 font-semibold mt-1">⚡ Anomaly</p>
      )}
    </div>
  )
}

// ─── Z-score category label ───────────────────────────────────────────────────
function categoryLabel(z) {
  if (z < -2) return 'Extreme low'
  if (z < -1) return 'Below avg'
  if (z < 1) return 'Near avg'
  if (z < 2) return 'Above avg'
  return 'Extreme high'
}

// ─── AnomalyChart ─────────────────────────────────────────────────────────────
export default function AnomalyChart() {
  const calendarData = useAppStore(s => s.calendarData)
  const loading = useAppStore(s => s.loading)

  // Get available years
  const years = useMemo(() => {
    if (!calendarData) return []
    return Array.from(new Set(calendarData.map(d => d.year))).sort((a, b) => b - a)
  }, [calendarData])

  const [selectedYear, setSelectedYear] = useState(null)

  const year = selectedYear ?? years[0] ?? 2023

  const chartData = useMemo(() => {
    if (!calendarData) return []
    const rows = calendarData.filter(d => d.year === year)
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const row = rows.find(d => d.month === m)
      return {
        month: monthAbbrev(m),
        z_score: row?.z_score ?? 0,
        hdi: row?.hdi ?? 0,
        is_anomaly: row?.is_anomaly ?? false,
      }
    })
  }, [calendarData, year])

  if (loading) {
    return <div className="skeleton h-48 w-full rounded-lg" />
  }

  if (!calendarData || calendarData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        <Activity size={18} className="mr-2 text-border-muted" />
        No anomaly data
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Activity size={15} className="text-ember" />
          Monthly Anomaly (Z-Score vs Historical Median)
        </h3>

        {/* Year selector */}
        <select
          value={year}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="select-dark text-xs py-1"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Z-score category legend */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {[
          { z: -3, label: 'Extreme low' },
          { z: -1.5, label: 'Below avg' },
          { z: 0.5, label: 'Near avg' },
          { z: 1.5, label: 'Above avg' },
          { z: 3, label: 'Extreme high' },
        ].map(({ z, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-text-muted">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: zscoreToColor(z) }} />
            {label}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#7D8590' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7D8590' }}
            tickLine={false}
            axisLine={false}
            width={30}
            tickFormatter={v => v.toFixed(1)}
          />
          <Tooltip content={<AnomalyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={0} stroke="#484F58" strokeWidth={1.5} />
          <ReferenceLine y={2} stroke="#FC4E2A" strokeDasharray="4 3" strokeOpacity={0.5} />
          <ReferenceLine y={-2} stroke="#41B6C4" strokeDasharray="4 3" strokeOpacity={0.5} />

          <Bar dataKey="z_score" radius={[3, 3, 0, 0]} maxBarSize={36}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={zscoreToColor(entry.z_score)}
                stroke={entry.is_anomaly ? '#00FFFF' : 'none'}
                strokeWidth={entry.is_anomaly ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-text-muted mt-1 text-right">
        Cyan border = statistical anomaly (|z| &gt; 2)
      </p>
    </div>
  )
}
