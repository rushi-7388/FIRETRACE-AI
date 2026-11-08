import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import useAppStore from '../store/useAppStore.js'
import { monthAbbrev } from '../utils/format.js'
import { Loader2, BarChart2, Info } from 'lucide-react'
import clsx from 'clsx'

// ─── Explanation card ─────────────────────────────────────────────────────────
function BiasExplainer() {
  return (
    <div className="card border-blue-500/20 bg-blue-500/5 mb-4">
      <div className="flex gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-muted leading-relaxed">
          <p className="font-semibold text-text-primary mb-1">Understanding Sensor Bias</p>
          <p>
            VIIRS (375 m resolution) detects significantly more individual fire hotspots than
            MODIS (1 km), because its finer pixels can resolve sub-kilometre fire fronts.
            Without harmonization, any multi-sensor time series shows an artificial step-change
            in fire activity when VIIRS data begins in 2012.
          </p>
          <p className="mt-2">
            The chart below shows raw MODIS counts, raw VIIRS counts, and the harmonized HDI
            (after cross-calibration) side-by-side — illustrating how the bias correction
            produces a consistent long-term record.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CompareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-muted rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-text-primary">{p.value?.toFixed(1) ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Compare page ─────────────────────────────────────────────────────────────
export default function Compare() {
  const { calendarData, loading, fetchHarmonized } = useAppStore()

  useEffect(() => {
    if (!calendarData) fetchHarmonized()
  }, [])

  // Available years
  const years = useMemo(() => {
    if (!calendarData) return []
    return Array.from(new Set(calendarData.map(d => d.year))).sort((a, b) => a - b)
  }, [calendarData])

  const [selectedYear, setSelectedYear] = useState(null)
  const year = selectedYear ?? years[years.length - 1] ?? 2023

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    if (!calendarData) return []
    const rows = calendarData.filter(d => d.year === year)
    return Array.from({ length: 12 }, (_, i) => {
      const m   = i + 1
      const row = rows.find(d => d.month === m)
      return {
        month:    monthAbbrev(m),
        modis:    row?.modis_count  ?? 0,
        viirs:    row?.viirs_count  ?? 0,
        hdi:      row?.hdi          ?? 0,
        z_score:  row?.z_score      ?? 0,
      }
    })
  }, [calendarData, year])

  // Annual aggregates
  const annualData = useMemo(() => {
    if (!calendarData) return []
    return years.map(y => {
      const rows = calendarData.filter(d => d.year === y)
      return {
        year:  y.toString(),
        modis: rows.reduce((s, d) => s + (d.modis_count ?? 0), 0),
        viirs: rows.reduce((s, d) => s + (d.viirs_count ?? 0), 0),
        hdi:   parseFloat(rows.reduce((s, d) => s + (d.hdi ?? 0), 0).toFixed(1)),
      }
    })
  }, [calendarData, years])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 size={32} className="animate-spin text-ember" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 overflow-y-auto h-[calc(100vh-56px)] animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-ember" />
          Sensor Comparison
        </h1>
        <p className="text-text-muted text-sm">
          Raw MODIS vs raw VIIRS detection counts vs harmonized Hotspot Density Index
        </p>
      </div>

      <BiasExplainer />

      {/* ── Annual Chart ──────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Annual Totals — All Years
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={annualData} margin={{ top: 4, right: 10, bottom: 0, left: -10 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: '#7D8590' }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7D8590' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CompareTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              iconType="square"
              formatter={(v) => <span style={{ color: '#7D8590', fontSize: 12 }}>{v}</span>}
            />
            <Bar dataKey="modis" name="MODIS (raw)"       fill="#60A5FA" radius={[2,2,0,0]} maxBarSize={18} />
            <Bar dataKey="viirs" name="VIIRS (raw)"       fill="#FB923C" radius={[2,2,0,0]} maxBarSize={18} />
            <Bar dataKey="hdi"   name="HDI (harmonized)"  fill="#FF4500" radius={[2,2,0,0]} maxBarSize={18} />

            {/* VIIRS start line */}
            <ReferenceLine
              x="2012"
              stroke="#FFD700"
              strokeDasharray="5 3"
              label={{ value: 'VIIRS start', fill: '#FFD700', fontSize: 10, position: 'top' }}
            />
          </BarChart>
        </ResponsiveContainer>

        <p className="text-xs text-text-muted mt-2 text-center">
          Note the step-change in raw VIIRS counts at 2012. The HDI corrects for this bias.
        </p>
      </section>

      {/* ── Monthly breakdown for selected year ───────────────── */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Monthly Breakdown
          </h2>
          <select
            value={year}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="select-dark"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 10, bottom: 0, left: -10 }} barGap={2}>
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
              width={40}
            />
            <Tooltip content={<CompareTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              iconType="square"
              formatter={(v) => <span style={{ color: '#7D8590', fontSize: 12 }}>{v}</span>}
            />
            <Bar dataKey="modis" name="MODIS (raw)"      fill="#60A5FA" radius={[2,2,0,0]} maxBarSize={24} />
            <Bar dataKey="viirs" name="VIIRS (raw)"      fill="#FB923C" radius={[2,2,0,0]} maxBarSize={24} />
            <Bar dataKey="hdi"   name="HDI (harmonized)" fill="#FF4500" radius={[2,2,0,0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ── Stats table ───────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Monthly Detail — {year}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-muted text-left">
                <th className="pb-2 pr-4 text-text-muted font-medium">Month</th>
                <th className="pb-2 pr-4 text-blue-400 font-medium">MODIS</th>
                <th className="pb-2 pr-4 text-orange-400 font-medium">VIIRS</th>
                <th className="pb-2 pr-4 text-ember font-medium">HDI</th>
                <th className="pb-2 text-text-muted font-medium">Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-bg-hover transition-colors">
                  <td className="py-2 pr-4 text-text-primary font-medium">{row.month}</td>
                  <td className="py-2 pr-4 font-mono text-blue-300">{row.modis}</td>
                  <td className="py-2 pr-4 font-mono text-orange-300">{row.viirs}</td>
                  <td className="py-2 pr-4 font-mono text-ember font-semibold">{row.hdi.toFixed(2)}</td>
                  <td className={clsx(
                    'py-2 font-mono text-xs',
                    Math.abs(row.z_score) > 2 ? 'text-cyan-400 font-semibold' :
                    row.z_score > 1 ? 'text-orange-400' :
                    row.z_score < -1 ? 'text-blue-400' : 'text-text-muted'
                  )}>
                    {row.z_score >= 0 ? '+' : ''}{row.z_score.toFixed(2)}σ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
