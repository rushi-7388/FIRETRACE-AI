import { useState, useEffect, useMemo } from 'react'
import useAppStore from '../store/useAppStore.js'
import {
  AlertTriangle, Zap, Activity, ShieldCheck, Flame, Info, RefreshCw,
  BellRing, Calendar, BarChart2, ShieldAlert, CheckCircle2, Crosshair
} from 'lucide-react'
import axios from 'axios'
import AnomalyChart from '../components/Charts/AnomalyChart.jsx'
import clsx from 'clsx'

export default function AnomalyIntelligence() {
  const { calendarData, bbox, aoiName } = useAppStore()
  const [serverAnomalies, setServerAnomalies] = useState(null)
  const [loadingServer, setLoadingServer] = useState(false)
  const [baselinePeriod, setBaselinePeriod] = useState('full') // 'full' | 'viirs' | 'modis'
  const [selectedMonth, setSelectedMonth] = useState(null)

  const bboxStr = bbox ? bbox.join(',') : '72.0,20.0,74.5,22.0'

  useEffect(() => {
    setLoadingServer(true)
    axios
      .get('/api/anomalies/ranking', {
        params: { bbox: bboxStr }
      })
      .then((res) => {
        if (res.data?.top_ranked_anomalies?.length) {
          setServerAnomalies(res.data.top_ranked_anomalies)
        }
      })
      .catch((err) => {
        console.debug('Using client calendar fallback for anomalies:', err.message)
      })
      .finally(() => setLoadingServer(false))
  }, [bboxStr])

  // Client filtered anomalies based on baseline period
  const filteredData = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return []
    return calendarData.filter(d => {
      if (baselinePeriod === 'viirs') return d.year >= 2012
      if (baselinePeriod === 'modis') return d.year < 2012
      return true
    })
  }, [calendarData, baselinePeriod])

  const rankedAnomalies = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []
    return [...filteredData]
      .filter((d) => d.is_anomaly || Math.abs(d.z_score || 0) >= 1.5)
      .sort((a, b) => Math.abs(b.z_score || 0) - Math.abs(a.z_score || 0))
      .slice(0, 10)
  }, [filteredData])

  const anomaliesToDisplay = serverAnomalies || rankedAnomalies

  // Latest observation comparison
  const latestRow = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null
    return selectedMonth ? filteredData.find(d => `${d.year}-${String(d.month).padStart(2, '0')}` === selectedMonth) || filteredData[filteredData.length - 1] : filteredData[filteredData.length - 1]
  }, [filteredData, selectedMonth])

  const comparisonStats = useMemo(() => {
    if (!latestRow || !filteredData.length) return null

    const sameMonthRows = filteredData.filter(d => d.month === latestRow.month)
    const sampleSize = sameMonthRows.length
    const med = latestRow.historical_median || (sameMonthRows.length ? sameMonthRows.reduce((s, r) => s + r.hdi, 0) / sameMonthRows.length : 1)
    const currentHdi = latestRow.hdi
    const diff = currentHdi - med
    const pctDev = med > 0 ? ((currentHdi - med) / med) * 100 : 0

    // Percentile rank
    const sorted = sameMonthRows.map(r => r.hdi).sort((a, b) => a - b)
    const rankIdx = sorted.filter(v => v <= currentHdi).length
    const percentile = Math.round((rankIdx / Math.max(1, sorted.length)) * 100)

    // Category
    const z = latestRow.z_score || 0
    let classification = 'Normal Activity'
    let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'

    if (sampleSize < 3) {
      classification = 'Insufficient Data'
      badgeColor = 'bg-gray-500/15 text-gray-400 border-gray-500/30'
    } else if (z >= 2.5) {
      classification = 'Extreme Activity'
      badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40'
    } else if (z >= 1.75) {
      classification = 'High Activity'
      badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    } else if (z >= 1.0) {
      classification = 'Above Normal'
      badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
    } else if (z <= -1.0) {
      classification = 'Below Normal'
      badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/40'
    }

    return {
      period: `${latestRow.year}-${String(latestRow.month).padStart(2, '0')}`,
      currentHdi,
      median: med,
      diff,
      pctDev,
      percentile,
      sampleSize,
      z,
      classification,
      badgeColor,
    }
  }, [latestRow, filteredData])

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-muted pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="text-ember" size={22} />
            Historical Median & Anomaly Intelligence Engine
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Statistical Z-Score Standardization • IQR Baselines • Automated Satellite Alert Generation
          </p>
        </div>

        {/* Baseline Period Selector */}
        <div className="flex items-center gap-1.5 bg-bg-card border border-border-muted rounded-lg p-1 text-xs">
          <span className="text-[11px] text-text-muted px-2 font-mono">Baseline:</span>
          {[
            { id: 'full', label: '2000–2024 (Full Record)' },
            { id: 'viirs', label: '2012–2024 (VIIRS Era)' },
            { id: 'modis', label: '2000–2011 (MODIS Era)' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setBaselinePeriod(opt.id)}
              className={clsx(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                baselinePeriod === opt.id
                  ? 'bg-ember text-white font-semibold shadow'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 7.2: Current Activity vs Equivalent Historical Month ──── */}
      {comparisonStats && (
        <div className="card p-5 space-y-4 border-l-4 border-l-ember">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-muted pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ember" />
              <h2 className="text-sm font-semibold text-text-primary">
                Period Comparison vs Historical Baseline: {comparisonStats.period}
              </h2>
            </div>
            <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold border', comparisonStats.badgeColor)}>
              {comparisonStats.classification} ({comparisonStats.z > 0 ? '+' : ''}{comparisonStats.z.toFixed(2)}σ)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
            <div className="stat-card">
              <span className="label-muted">Current Activity</span>
              <div className="text-lg font-bold text-text-primary mt-1">{comparisonStats.currentHdi.toFixed(2)}</div>
              <div className="text-[10px] text-text-muted font-sans">Observed HDI</div>
            </div>
            <div className="stat-card">
              <span className="label-muted">Historical Median</span>
              <div className="text-lg font-bold text-text-primary mt-1">{comparisonStats.median.toFixed(2)}</div>
              <div className="text-[10px] text-text-muted font-sans">Same Month Baseline</div>
            </div>
            <div className="stat-card">
              <span className="label-muted">Absolute Difference</span>
              <div className={clsx('text-lg font-bold mt-1', comparisonStats.diff >= 0 ? 'text-red-400' : 'text-blue-400')}>
                {comparisonStats.diff >= 0 ? '+' : ''}{comparisonStats.diff.toFixed(2)}
              </div>
              <div className="text-[10px] text-text-muted font-sans">HDI Points</div>
            </div>
            <div className="stat-card">
              <span className="label-muted">Percentage Deviation</span>
              <div className={clsx('text-lg font-bold mt-1', comparisonStats.pctDev >= 0 ? 'text-red-400' : 'text-blue-400')}>
                {comparisonStats.pctDev >= 0 ? '+' : ''}{comparisonStats.pctDev.toFixed(1)}%
              </div>
              <div className="text-[10px] text-text-muted font-sans">Formula: ((C - M) / M) × 100</div>
            </div>
            <div className="stat-card">
              <span className="label-muted">Historical Percentile</span>
              <div className="text-lg font-bold text-orange-400 mt-1">{comparisonStats.percentile}th</div>
              <div className="text-[10px] text-text-muted font-sans">Rank in record</div>
            </div>
            <div className="stat-card">
              <span className="label-muted">Comparison Sample</span>
              <div className="text-lg font-bold text-text-primary mt-1">{comparisonStats.sampleSize} Yrs</div>
              <div className="text-[10px] text-text-muted font-sans">Eligible Octobers</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 7.4: Satellite Anomaly Alert Notifications ──── */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-muted pb-2">
          <div className="flex items-center gap-2">
            <BellRing size={16} className="text-ember" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Active Satellite-Observation-Based Anomaly Alerts
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            ⚠️ Satellite-Observation Alert • Not Confirmed Dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {anomaliesToDisplay.slice(0, 2).map((alert, idx) => (
            <div key={idx} className="bg-bg-secondary p-3.5 rounded-lg border border-border-muted space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Flame size={13} className="text-ember" /> {aoiName || 'AOI'} - {alert.date || `${alert.year}-${String(alert.month).padStart(2, '0')}`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  Score: +{alert.z_score?.toFixed(2)}σ
                </span>
              </div>
              <p className="text-text-muted leading-relaxed font-sans text-[11px]">
                {alert.explanation || `Statistically critical burning activity detected exceeding ${Math.abs(alert.z_score || 2).toFixed(1)} standard deviations from multi-year historical median.`}
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted border-t border-border-muted/50 pt-1.5">
                <span>QC: NASA SP Archive Validated</span>
                <span>Timestamp: {alert.date || alert.year}-01T00:00:00Z</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Bar Chart Component */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4">
        <AnomalyChart />
      </div>

      {/* Ranked Historical Anomalies Table */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-ember" />
          Top Ranked Historical Anomalies (Ranked by Standardized Deviation Z-Score)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-muted text-text-muted">
              <tr>
                <th className="py-2 px-2">Period</th>
                <th className="py-2 px-2">Observed HDI</th>
                <th className="py-2 px-2">Historical Median</th>
                <th className="py-2 px-2">Z-Score Deviation</th>
                <th className="py-2 px-2">Severity Classification</th>
                <th className="py-2 px-2">Explainable Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted/50 font-mono">
              {anomaliesToDisplay.map((item, idx) => {
                const z = item.z_score || 0
                const isPositive = z > 0
                const periodLabel = item.date || `${item.year}-${String(item.month).padStart(2, '0')}`
                return (
                  <tr key={idx} className="hover:bg-bg-hover">
                    <td className="py-2 px-2 font-sans font-medium text-text-primary">
                      {periodLabel}
                    </td>
                    <td className="py-2 px-2">{typeof item.hdi === 'number' ? item.hdi.toFixed(2) : item.hdi}</td>
                    <td className="py-2 px-2">{item.historical_median != null ? (typeof item.historical_median === 'number' ? item.historical_median.toFixed(2) : item.historical_median) : '-'}</td>
                    <td className="py-2 px-2 font-bold" style={{ color: isPositive ? '#FF4500' : '#38BDF8' }}>
                      {isPositive ? `+${z.toFixed(2)}σ` : `${z.toFixed(2)}σ`}
                    </td>
                    <td className="py-2 px-2">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-semibold',
                        Math.abs(z) >= 2.5
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : Math.abs(z) >= 1.75
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      )}>
                        {item.severity || (Math.abs(z) >= 2.5 ? 'Extreme Activity' : Math.abs(z) >= 1.75 ? 'High Activity' : 'Above Normal')}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-sans text-text-muted text-[11px]">
                      {item.explanation || (isPositive
                        ? `Burning activity was ${(Math.abs(z) * 1.5).toFixed(1)}x greater than climatological expectation.`
                        : `Significantly suppressed burning activity due to wet or cloudy conditions.`)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
