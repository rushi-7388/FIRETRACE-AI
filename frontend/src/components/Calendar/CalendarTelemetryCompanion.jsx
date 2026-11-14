import React, { useMemo } from 'react'
import useAppStore from '../../store/useAppStore.js'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Flame, TrendingUp, AlertTriangle, ShieldCheck, Zap, Calendar,
  BarChart3, Activity, Info, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

export default function CalendarTelemetryCompanion() {
  const calendarData = useAppStore(s => s.calendarData)
  const aoiName = useAppStore(s => s.aoiName)

  // 1. Annual Aggregation & Trends (2000 - 2026)
  const annualData = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return []
    const yearMap = {}

    calendarData.forEach(d => {
      if (!yearMap[d.year]) {
        yearMap[d.year] = {
          year: d.year,
          totalHdi: 0,
          anomaliesCount: 0,
          maxZScore: -99,
          peakMonthHdi: 0,
        }
      }
      yearMap[d.year].totalHdi += (d.hdi || 0)
      if (d.is_anomaly || Math.abs(d.z_score || 0) >= 2.0) {
        yearMap[d.year].anomaliesCount += 1
      }
      if ((d.z_score || 0) > yearMap[d.year].maxZScore) {
        yearMap[d.year].maxZScore = d.z_score || 0
      }
      if ((d.hdi || 0) > yearMap[d.year].peakMonthHdi) {
        yearMap[d.year].peakMonthHdi = d.hdi || 0
      }
    })

    return Object.values(yearMap).sort((a, b) => a.year - b.year)
  }, [calendarData])

  // 2. Executive Climatology & Anomaly Summary
  const stats = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return null

    // Monthly baseline profiles
    const monthTotals = Array(12).fill(0)
    const monthCounts = Array(12).fill(0)
    let totalAnomalies = 0

    calendarData.forEach(d => {
      const mIdx = d.month - 1
      monthTotals[mIdx] += (d.hdi || 0)
      monthCounts[mIdx] += 1
      if (d.is_anomaly || Math.abs(d.z_score || 0) >= 2.0) {
        totalAnomalies += 1
      }
    })

    const monthAverages = monthTotals.map((tot, idx) => tot / Math.max(1, monthCounts[idx]))
    const peakMonthIdx = monthAverages.indexOf(Math.max(...monthAverages))
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const peakMonthName = monthNames[peakMonthIdx]

    // Highest anomaly year
    let maxYear = annualData[0]?.year || 2023
    let maxYearVal = 0
    annualData.forEach(y => {
      if (y.totalHdi > maxYearVal) {
        maxYearVal = y.totalHdi
        maxYear = y.year
      }
    })

    const criticalYears = annualData.filter(y => y.anomaliesCount > 0).map(y => y.year)

    return {
      peakMonthName,
      peakSeasonLabel: [2, 3, 4].includes(peakMonthIdx)
        ? 'Pre-Monsoon Peak (Mar–May)'
        : [9, 10].includes(peakMonthIdx)
          ? 'Post-Harvest Stubble (Oct–Nov)'
          : [5, 6, 7].includes(peakMonthIdx)
            ? 'Boreal / Dry Summer Season'
            : 'Seasonal Climate Peak',
      totalAnomalies,
      worstYear: maxYear,
      criticalYears: criticalYears.slice(0, 7),
      monthAverages,
    }
  }, [calendarData, annualData])

  if (!stats) return null

  return (
    <div className="flex flex-col h-full justify-between space-y-4 text-xs">
      
      {/* ── 4 Executive Summary KPI Cards ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-bg-secondary/80 border border-border-muted rounded-xl p-2.5">
          <div className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
            <Flame size={12} className="text-ember" />
            <span>Peak Fire Season</span>
          </div>
          <div className="text-sm font-bold text-text-primary mt-1 truncate">
            {stats.peakMonthName}
          </div>
          <div className="text-[10px] text-ember truncate font-mono mt-0.5">
            {stats.peakSeasonLabel}
          </div>
        </div>

        <div className="bg-bg-secondary/80 border border-border-muted rounded-xl p-2.5">
          <div className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
            <Zap size={12} className="text-cyan-400" />
            <span>Critical Anomalies</span>
          </div>
          <div className="text-sm font-bold text-cyan-400 mt-1 font-mono">
            {stats.totalAnomalies} Events
          </div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">
            Statistical Outliers (&gt;2σ)
          </div>
        </div>

        <div className="bg-bg-secondary/80 border border-border-muted rounded-xl p-2.5">
          <div className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
            <AlertTriangle size={12} className="text-orange-400" />
            <span>Record Extreme Year</span>
          </div>
          <div className="text-sm font-bold text-orange-400 mt-1 font-mono">
            {stats.worstYear}
          </div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">
            Maximum Annual HDI Load
          </div>
        </div>

        <div className="bg-bg-secondary/80 border border-border-muted rounded-xl p-2.5">
          <div className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Baseline Accuracy</span>
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-1 font-mono">
            27 Years Unbroken
          </div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">
            MODIS + VIIRS Harmonized
          </div>
        </div>
      </div>

      {/* ── Annual Burn Trajectory Bar Chart (2000–2026) ──────── */}
      <div className="bg-bg-secondary/50 border border-border-muted rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
            <TrendingUp size={13} className="text-ember" />
            <span>27-Year Annual Burning Trajectory (2000–2026)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-ember" />
              <span className="text-text-muted">Nominal Year</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 font-bold">Anomaly Year</span>
            </span>
          </div>
        </div>

        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="year"
                stroke="#6E7681"
                fontSize={9}
                tickLine={false}
                interval={2}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis
                stroke="#6E7681"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload
                  return (
                    <div className="bg-[#1C2128] border border-[#30363D] rounded-lg p-2 text-[11px] font-mono shadow-xl space-y-0.5">
                      <div className="font-bold text-text-primary flex items-center justify-between gap-3">
                        <span>Year {item.year}</span>
                        {item.anomaliesCount > 0 && (
                          <span className="text-cyan-400 font-bold text-[9px] bg-cyan-500/10 px-1 rounded border border-cyan-400/30">
                            ⚡ ANOMALIES: {item.anomaliesCount}
                          </span>
                        )}
                      </div>
                      <div className="text-ember">Annual HDI: {item.totalHdi.toFixed(1)}</div>
                      <div className="text-text-muted">Peak Month HDI: {item.peakMonthHdi.toFixed(1)}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="totalHdi" radius={[2, 2, 0, 0]}>
                {annualData.map((entry) => (
                  <Cell
                    key={`cell-${entry.year}`}
                    fill={entry.anomaliesCount > 0 ? '#00FFFF' : '#FF4500'}
                    opacity={entry.anomaliesCount > 0 ? 0.95 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 12-Month Climatology Seasonal Profile ─────────────── */}
      <div className="bg-bg-secondary/50 border border-border-muted rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
            <Calendar size={13} className="text-ember" />
            <span>12-Month Climatological Seasonal Baseline Profile</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono">
            {aoiName || 'Active AOI'}
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center font-mono">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, idx) => {
            const val = stats.monthAverages[idx] || 0
            const maxVal = Math.max(...stats.monthAverages) || 1
            const ratio = val / maxVal
            const isMonsoon = ratio < 0.25
            const isPeak = ratio > 0.75

            return (
              <div
                key={mName}
                className={clsx(
                  'rounded-lg p-1.5 border transition-all flex flex-col items-center justify-center',
                  isPeak
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : isMonsoon
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-bg-card border-border-muted text-text-muted'
                )}
              >
                <div className="text-[10px] font-bold">{mName}</div>
                <div className="text-[9px] mt-0.5 font-semibold text-text-primary">
                  {val.toFixed(1)}
                </div>
                <div className="text-[8px] opacity-75">
                  {isPeak ? 'PEAK' : isMonsoon ? 'CALM' : 'MID'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Critical Anomaly Years Tags Footer ─────────────────── */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-text-muted pt-1">
        <span className="font-semibold text-text-primary flex items-center gap-1">
          <Zap size={11} className="text-cyan-400" />
          <span>Statistically Significant Fire Surge Years:</span>
        </span>
        {stats.criticalYears.map(yr => (
          <span
            key={yr}
            className="bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 font-bold px-1.5 py-0.5 rounded text-[10px]"
          >
            {yr}
          </span>
        ))}
      </div>

    </div>
  )
}

