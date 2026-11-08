import useAppStore from '../../store/useAppStore.js'
import { useMemo } from 'react'
import {
  Flame, Calendar, TrendingUp, TrendingDown, Minus,
  AlertTriangle, BarChart2, Layers,
} from 'lucide-react'
import { formatDate, formatHDI, formatNumber, formatPercent, monthAbbrev } from '../../utils/format.js'
import clsx from 'clsx'

// ─── Single Stat Card ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconColor, label, value, sub, highlight }) {
  return (
    <div className={clsx(
      'stat-card',
      highlight && 'border-ember/50 shadow-glow-ember'
    )}>
      <div className="flex items-start justify-between">
        <span className="label-muted">{label}</span>
        <Icon size={16} style={{ color: iconColor }} className="mt-0.5 flex-shrink-0" />
      </div>
      <div className="text-xl font-bold font-mono text-text-primary mt-1">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  )
}

// ─── SummaryStats ─────────────────────────────────────────────────────────────
export default function SummaryStats() {
  const calendarData = useAppStore(s => s.calendarData)
  const loading = useAppStore(s => s.loading)

  const stats = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return null

    // Total harmonized hotspots
    const totalHotspots = calendarData.reduce((sum, d) => sum + (d.harmonized_count ?? 0), 0)

    // Peak month (highest HDI)
    const peak = calendarData.reduce((best, d) => d.hdi > (best?.hdi ?? 0) ? d : best, null)

    // Current vs historical median (last row in data)
    const last = calendarData[calendarData.length - 1]
    const pctVsMedian = last && last.historical_median
      ? ((last.hdi - last.historical_median) / (last.historical_median || 1)) * 100
      : null

    // Anomaly count
    const anomalyCount = calendarData.filter(d => d.is_anomaly).length

    // 5-year trend: compare last 5 years avg to prior 5 years avg
    const years = Array.from(new Set(calendarData.map(d => d.year))).sort((a, b) => a - b)
    const recentYrs = years.slice(-5)
    const priorYrs = years.slice(-10, -5)
    const recentAvg = calendarData.filter(d => recentYrs.includes(d.year)).reduce((s, d) => s + d.hdi, 0) / (recentYrs.length * 12 || 1)
    const priorAvg = calendarData.filter(d => priorYrs.includes(d.year)).reduce((s, d) => s + d.hdi, 0) / (priorYrs.length * 12 || 1)
    const trendPct = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0

    return { totalHotspots, peak, pctVsMedian, anomalyCount, trendPct, last }
  }, [calendarData])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-text-muted text-xs text-center py-4">
        Run analysis to see summary statistics
      </div>
    )
  }

  const { totalHotspots, peak, pctVsMedian, anomalyCount, trendPct, last } = stats

  const TrendIcon = trendPct > 5
    ? TrendingUp
    : trendPct < -5
      ? TrendingDown
      : Minus

  const trendColor = trendPct > 5 ? '#FC4E2A' : trendPct < -5 ? '#A8DDB5' : '#7D8590'
  const trendLabel = trendPct > 5 ? 'Worsening trend' : trendPct < -5 ? 'Improving trend' : 'Stable trend'

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        icon={Layers}
        iconColor="#FB923C"
        label="Total Hotspots"
        value={formatNumber(totalHotspots)}
        sub="Harmonized (MODIS + VIIRS)"
      />
      <StatCard
        icon={Flame}
        iconColor="#FF4500"
        label="Peak Activity"
        value={peak ? formatDate(peak.year, peak.month) : '-'}
        sub={peak ? `HDI ${formatHDI(peak.hdi)}` : ''}
        highlight={!!peak}
      />
      <StatCard
        icon={Calendar}
        iconColor="#60A5FA"
        label="Latest vs Median"
        value={pctVsMedian != null ? formatPercent(pctVsMedian) : '-'}
        sub={last ? formatDate(last.year, last.month) : ''}
      />
      <StatCard
        icon={AlertTriangle}
        iconColor="#FFD700"
        label="Anomaly Months"
        value={anomalyCount}
        sub="months with |z| > 2"
      />
      <div className="col-span-2">
        <StatCard
          icon={TrendIcon}
          iconColor={trendColor}
          label="5-Year Trend"
          value={formatPercent(trendPct)}
          sub={trendLabel}
        />
      </div>
    </div>
  )
}
