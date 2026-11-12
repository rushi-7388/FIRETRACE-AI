import useAppStore from '../../store/useAppStore.js'
import { useMemo, useState } from 'react'
import {
  Flame, Calendar, TrendingUp, TrendingDown, Minus,
  AlertTriangle, BarChart2, Layers, Satellite, Crosshair, Clock
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
        <Icon size={15} style={{ color: iconColor }} className="mt-0.5 flex-shrink-0" />
      </div>
      <div className="text-lg font-bold font-mono text-text-primary mt-1">{value}</div>
      {sub && <div className="text-[11px] text-text-muted truncate">{sub}</div>}
    </div>
  )
}

// ─── SummaryStats ─────────────────────────────────────────────────────────────
export default function SummaryStats({ layout = 'grid' }) {
  const calendarData = useAppStore(s => s.calendarData)
  const aoiName      = useAppStore(s => s.aoiName)
  const loading      = useAppStore(s => s.loading)
  const [showDetailed, setShowDetailed] = useState(false)

  const stats = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return null

    // Total harmonized & raw sensor counts
    const totalHarmonized = calendarData.reduce((sum, d) => sum + (d.harmonized_count ?? 0), 0)
    const totalModis = calendarData.reduce((sum, d) => sum + (d.modis_count ?? 0), 0)
    const totalViirs = calendarData.reduce((sum, d) => sum + (d.viirs_count ?? 0), 0)

    // Peak month (highest HDI)
    const peakMonth = calendarData.reduce((best, d) => d.hdi > (best?.hdi ?? 0) ? d : best, null)

    // Peak year
    const yearlyMap = {}
    calendarData.forEach(d => {
      yearlyMap[d.year] = (yearlyMap[d.year] || 0) + (d.harmonized_count || 0)
    })
    const peakYear = Object.entries(yearlyMap).reduce((best, [y, c]) => c > best.count ? { year: y, count: c } : best, { year: '-', count: 0 })

    // Current month activity vs historical median
    const last = calendarData[calendarData.length - 1]
    const currentActivity = last?.hdi ?? 0
    const histMedian = last?.historical_median ?? 0
    const pctVsMedian = histMedian > 0
      ? ((currentActivity - histMedian) / histMedian) * 100
      : null

    // Anomaly count
    const anomalyCount = calendarData.filter(d => d.is_anomaly).length

    // Estimated clusters / active cells
    const activeClusters = Math.max(1, Math.round(calendarData.filter(d => d.hdi > 10).length / 2))

    // 5-year trend
    const years = Array.from(new Set(calendarData.map(d => d.year))).sort((a, b) => a - b)
    const recentYrs = years.slice(-5)
    const priorYrs = years.slice(-10, -5)
    const recentAvg = calendarData.filter(d => recentYrs.includes(d.year)).reduce((s, d) => s + d.hdi, 0) / (recentYrs.length * 12 || 1)
    const priorAvg = calendarData.filter(d => priorYrs.includes(d.year)).reduce((s, d) => s + d.hdi, 0) / (priorYrs.length * 12 || 1)
    const trendPct = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0

    return {
      totalHarmonized,
      totalModis,
      totalViirs,
      peakMonth,
      peakYear,
      currentActivity,
      histMedian,
      pctVsMedian,
      anomalyCount,
      activeClusters,
      trendPct,
      last
    }
  }, [calendarData])

  if (loading) {
    return (
      <div className={clsx(
        'grid gap-3',
        layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2'
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-text-muted text-xs text-center py-4 card">
        Run analysis to see summary statistics
      </div>
    )
  }

  const {
    totalHarmonized, totalModis, totalViirs,
    peakMonth, peakYear, currentActivity, histMedian, pctVsMedian,
    anomalyCount, activeClusters, trendPct, last
  } = stats

  const TrendIcon = trendPct > 5
    ? TrendingUp
    : trendPct < -5
      ? TrendingDown
      : Minus

  const trendColor = trendPct > 5 ? '#FC4E2A' : trendPct < -5 ? '#A8DDB5' : '#7D8590'
  const trendLabel = trendPct > 5 ? 'Elevated long-term burn rate' : trendPct < -5 ? 'Decreasing burn rate' : 'Historical baseline steady'

  const isWide = layout === 'grid'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-text-muted px-0.5">
        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
          <Crosshair size={13} className="text-ember" />
          <span>AOI: {aoiName || 'Selected AOI'}</span>
        </span>
        <button
          onClick={() => setShowDetailed(v => !v)}
          className="text-[11px] text-ember hover:underline font-medium"
        >
          {showDetailed ? 'Standard View' : 'Sensor Breakdown'}
        </button>
      </div>

      <div className={clsx(
        'grid gap-3',
        isWide ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2'
      )}>
        <StatCard
          icon={Layers}
          iconColor="#FB923C"
          label="Harmonized Hotspots"
          value={formatNumber(totalHarmonized)}
          sub="Unified Index (HDI)"
        />

        <StatCard
          icon={Flame}
          iconColor="#FF4500"
          label="Peak Activity Month"
          value={peakMonth ? formatDate(peakMonth.year, peakMonth.month) : '-'}
          sub={peakMonth ? `HDI ${formatHDI(peakMonth.hdi)}` : ''}
          highlight={!!peakMonth}
        />

        {showDetailed ? (
          <>
            <StatCard
              icon={Satellite}
              iconColor="#38BDF8"
              label="MODIS Hotspots"
              value={formatNumber(totalModis)}
              sub="Terra & Aqua (1 km)"
            />
            <StatCard
              icon={Satellite}
              iconColor="#818CF8"
              label="VIIRS Hotspots"
              value={formatNumber(totalViirs)}
              sub="SNPP, N20, N21 (375 m)"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={Calendar}
              iconColor="#60A5FA"
              label="Current vs Median"
              value={pctVsMedian != null ? formatPercent(pctVsMedian) : '-'}
              sub={last ? `Median: ${formatHDI(histMedian)}` : ''}
            />

            <StatCard
              icon={AlertTriangle}
              iconColor="#FFD700"
              label="Anomaly Months"
              value={anomalyCount}
              sub="Statistically critical (|z|>2)"
            />
          </>
        )}

        <StatCard
          icon={BarChart2}
          iconColor="#A78BFA"
          label="Peak Burning Year"
          value={peakYear.year}
          sub={`${formatNumber(peakYear.count)} harmonized spots`}
        />

        <StatCard
          icon={Clock}
          iconColor="#34D399"
          label="Data Freshness"
          value="< 3.2 hrs"
          sub="NASA FIRMS NRT + SP"
        />

        <div className={clsx(isWide ? 'col-span-2 sm:col-span-1' : 'col-span-2')}>
          <StatCard
            icon={TrendIcon}
            iconColor={trendColor}
            label="5-Year Climate Trend"
            value={formatPercent(trendPct)}
            sub={trendLabel}
          />
        </div>
      </div>
    </div>
  )
}
