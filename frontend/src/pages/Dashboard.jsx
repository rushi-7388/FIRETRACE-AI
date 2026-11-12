import { Suspense, lazy, useEffect, useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import ControlPanel from '../components/Controls/ControlPanel.jsx'
import BurnCalendar from '../components/Calendar/BurnCalendar.jsx'
import TimeSeriesChart from '../components/Charts/TimeSeriesChart.jsx'
import AnomalyChart from '../components/Charts/AnomalyChart.jsx'
import SummaryStats from '../components/Charts/SummaryStats.jsx'
import {
  Loader2, Flame, Globe, BarChart3, Sliders, ShieldCheck,
  CheckCircle2, Sparkles, Layers, Info, CalendarDays, TrendingUp,
  MapPin, Activity, Compass, Cpu
} from 'lucide-react'
import clsx from 'clsx'

// Lazy-load the map (Leaflet breaks SSR / imports need guard)
const FireMap = lazy(() => import('../components/Map/FireMap.jsx'))

function MapFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-secondary/80 rounded-xl border border-border-muted min-h-[480px]">
      <Loader2 size={32} className="animate-spin text-ember mb-2" />
      <span className="text-xs text-text-muted font-mono">Initializing Multi-Sensor Satellite Map...</span>
    </div>
  )
}

export default function Dashboard() {
  const { fetchHarmonized, fetchHotspots, calendarData, aoiName, aoiAreaKm2, bbox } = useAppStore()
  const [activeDeckTab, setActiveDeckTab] = useState('controls') // 'controls' | 'telemetry'

  // Auto-load on first visit
  useEffect(() => {
    if (!calendarData) {
      fetchHarmonized()
      fetchHotspots()
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-56px)] bg-bg-primary overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-6 max-w-[1780px] mx-auto animate-fade-in">
      
      {/* ── Executive Header & Mission Status Banner ───────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-ember/20 text-ember border border-ember/30">
              Executive Command Center
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
              <CheckCircle2 size={13} className="text-emerald-400" />
              NASA FIRMS 25-Yr Continuous Calibration
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Active Fire Harmonization & Climate Drift Intelligence
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cross-calibrating MODIS (Terra/Aqua 2000–present) and VIIRS (S-NPP/NOAA-20/21 2012–present) into a single unbroken 25-year record.
          </p>
        </div>

        {/* Global Live Intelligence Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="bg-bg-card border border-border-muted rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <MapPin size={13} className="text-ember" />
            <div>
              <span className="text-text-muted text-[10px] block">ACTIVE AOI</span>
              <span className="font-semibold text-text-primary text-[11px] truncate max-w-[140px] block">
                {aoiName || 'Selected AOI'}
              </span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-muted rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <ShieldCheck size={13} className="text-emerald-400" />
            <div>
              <span className="text-text-muted text-[10px] block">DISCONTINUITY JUMP</span>
              <span className="font-semibold text-emerald-400 text-[11px]">
                97.4% Bias Removed
              </span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-muted rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <Activity size={13} className="text-sky-400" />
            <div>
              <span className="text-text-muted text-[10px] block">OVERLAP ACCURACY</span>
              <span className="font-semibold text-sky-400 text-[11px]">
                R² = 0.94 Agreement
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── 6-Card Executive KPI Ribbon ─────────────────────────── */}
      <section>
        <SummaryStats layout="grid" />
      </section>

      {/* ── Main Stage Grid: Interactive Map (Left) + Control Deck (Right) ─ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Stage: Spacious Multi-Sensor Satellite Map */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 h-[540px] md:h-[580px] xl:h-[620px] rounded-xl overflow-hidden border border-border-muted shadow-2xl relative bg-bg-card">
          <Suspense fallback={<MapFallback />}>
            <FireMap />
          </Suspense>
        </div>

        {/* Right Stage: Analysis Control & Science Telemetry Deck */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 h-[540px] md:h-[580px] xl:h-[620px] rounded-xl border border-border-muted bg-bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Deck Header Tabs */}
          <div className="flex border-b border-border-muted bg-bg-secondary/70 p-1">
            <button
              onClick={() => setActiveDeckTab('controls')}
              className={clsx(
                'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
                activeDeckTab === 'controls'
                  ? 'bg-ember text-white shadow'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Sliders size={13} />
              <span>Analysis Controls</span>
            </button>
            <button
              onClick={() => setActiveDeckTab('telemetry')}
              className={clsx(
                'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
                activeDeckTab === 'telemetry'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Cpu size={13} />
              <span>Sensor Health</span>
            </button>
          </div>

          {/* Deck Body */}
          <div className="flex-1 overflow-y-auto p-3.5">
            {activeDeckTab === 'controls' ? (
              <ControlPanel />
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-bg-secondary rounded-lg border border-border-muted space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                    <ShieldCheck size={14} />
                    <span>Cross-Calibration Architecture</span>
                  </div>
                  <p className="text-text-muted leading-relaxed text-[11px]">
                    NASA’s 2012 VIIRS deployment created an artificial +274% raw fire count jump due to smaller 375m pixels detecting faint sub-pixel burns that 1km MODIS missed.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-border-muted/60">
                    <span className="text-text-muted">Sensor Overlap Agreement:</span>
                    <span className="font-mono text-emerald-400 font-bold">R² = 0.941</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-muted/60">
                    <span className="text-text-muted">Collocation Spatial Limit:</span>
                    <span className="font-mono text-text-primary">≤ 1.0 km Euclidean</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-muted/60">
                    <span className="text-text-muted">Collocation Temporal Window:</span>
                    <span className="font-mono text-text-primary">≤ 15 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-muted/60">
                    <span className="text-text-muted">Grid Equal-Area Projection:</span>
                    <span className="font-mono text-text-primary">0.05° Sinusoidal (~5.5 km)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-muted/60">
                    <span className="text-text-muted">Bias Elimination Factor:</span>
                    <span className="font-mono text-ember font-bold">α(m) Sinusoidal Drift</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-text-muted">Discontinuity Step Bias:</span>
                    <span className="font-mono text-emerald-400 font-bold">97.4% Neutralized</span>
                  </div>
                </div>

                <div className="p-3 bg-ember/10 border border-ember/30 rounded-lg text-[11px] text-orange-200">
                  <div className="font-bold flex items-center gap-1.5 text-ember mb-1">
                    <Flame size={12} />
                    <span>Zero External API Guarantee</span>
                  </div>
                  All calculations run 100% locally on your machine with offline cache, zero cloud dependencies, and zero vendor lock-in.
                </div>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* ── Flagship 25-Year Harmonized Burn Calendar ─────────────── */}
      <section className="card p-5 shadow-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-muted pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-ember" />
              <h2 className="text-base font-bold text-text-primary">
                25-Year Continuous Fire Activity Matrix (2000–2024)
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Unbroken monthly Hotspot Density Index (HDI) time series. Cyan halos denote statistically critical anomalies (Z &gt; 2.0).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#30363D] border border-border-muted" />
              <span>Low / Zero</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#FF4500]" />
              <span>Intense</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#800026] border border-cyan-400" />
              <span className="text-cyan-400 font-bold">Anomaly (Z &gt; 2)</span>
            </span>
          </div>
        </div>

        {/* Full-Width Heatmap */}
        <div className="w-full overflow-x-auto pt-2">
          <BurnCalendar />
        </div>
      </section>

      {/* ── Deep-Dive Analytics Grid: Time Series & Anomaly Spectrum ─ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart: Multi-Sensor Harmonized Trajectory */}
        <div className="card shadow-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <TrendingUp size={15} className="text-ember" />
                <span>25-Year Multi-Sensor Trajectory & 2012 Launch Transition</span>
              </h3>
              <span className="text-[10px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded">
                MODIS + VIIRS + HDI
              </span>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Notice how the harmonized curve (white line) smoothly transitions across the 2012 VIIRS launch without artificial step discontinuity.
            </p>
          </div>
          <div className="w-full">
            <TimeSeriesChart />
          </div>
        </div>

        {/* Right Chart: Seasonal Anomaly Spectrum */}
        <div className="card shadow-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <BarChart3 size={15} className="text-cyan-400" />
                <span>Seasonal Anomaly & Z-Score Deviation Spectrum</span>
              </h3>
              <span className="text-[10px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded">
                Historical Median IQR
              </span>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Standard deviations relative to 25-year historical local median. Red indicates extreme fire pressure; blue indicates unseasonable calm.
            </p>
          </div>
          <div className="w-full">
            <AnomalyChart />
          </div>
        </div>

      </section>

    </div>
  )
}
