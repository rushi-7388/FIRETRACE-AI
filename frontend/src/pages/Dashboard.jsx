import { Suspense, lazy, useEffect } from 'react'
import useAppStore from '../store/useAppStore.js'
import ControlPanel   from '../components/Controls/ControlPanel.jsx'
import BurnCalendar   from '../components/Calendar/BurnCalendar.jsx'
import TimeSeriesChart from '../components/Charts/TimeSeriesChart.jsx'
import AnomalyChart   from '../components/Charts/AnomalyChart.jsx'
import SummaryStats   from '../components/Charts/SummaryStats.jsx'
import { Loader2 } from 'lucide-react'

// Lazy-load the map (Leaflet breaks SSR / imports need guard)
const FireMap = lazy(() => import('../components/Map/FireMap.jsx'))

function MapFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-secondary rounded-xl border border-border-muted">
      <Loader2 size={24} className="animate-spin text-ember" />
    </div>
  )
}

export default function Dashboard() {
  const { fetchHarmonized, fetchHotspots, calendarData } = useAppStore()

  // Auto-load on first visit
  useEffect(() => {
    if (!calendarData) {
      fetchHarmonized()
      fetchHotspots()
    }
  }, [])

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden animate-fade-in">
      {/* ── Left Sidebar: Controls ─────────────────────────── */}
      <aside className="w-56 flex-shrink-0 border-r border-border-muted bg-bg-secondary p-3 overflow-y-auto">
        <ControlPanel />
      </aside>

      {/* ── Center: Map + Calendar ─────────────────────────── */}
      <main
        id="firetrace-main-content"
        className="flex-1 flex flex-col overflow-hidden min-w-0"
      >
        {/* Map (40% height) */}
        <div className="flex-shrink-0" style={{ height: '40%' }}>
          <div className="h-full p-2">
            <Suspense fallback={<MapFallback />}>
              <FireMap />
            </Suspense>
          </div>
        </div>

        {/* Calendar Heatmap (60% height) */}
        <div className="flex-1 overflow-y-auto border-t border-border-muted">
          <div className="p-3">
            <div className="card">
              <BurnCalendar />
            </div>
          </div>
        </div>
      </main>

      {/* ── Right Panel: Charts ────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 border-l border-border-muted bg-bg-secondary overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* Summary Stats */}
          <section>
            <SummaryStats />
          </section>

          {/* Time Series Chart */}
          <section className="card">
            <TimeSeriesChart />
          </section>

          {/* Anomaly Chart */}
          <section className="card">
            <AnomalyChart />
          </section>
        </div>
      </aside>
    </div>
  )
}
