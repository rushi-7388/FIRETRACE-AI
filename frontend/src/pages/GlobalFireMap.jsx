import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import FireMap from '../components/Map/FireMap.jsx'
import { Filter, Layers, Satellite, Flame, Download } from 'lucide-react'
import clsx from 'clsx'

const SATELLITE_OPTIONS = [
  { id: 'TERRA', label: 'Terra (MODIS)', year: '2000+' },
  { id: 'AQUA', label: 'Aqua (MODIS)', year: '2002+' },
  { id: 'SNPP', label: 'Suomi-NPP (VIIRS)', year: '2012+' },
  { id: 'NOAA20', label: 'NOAA-20 (VIIRS)', year: '2018+' },
  { id: 'NOAA21', label: 'NOAA-21 (VIIRS)', year: '2022+' },
]

export default function GlobalFireMap() {
  const { hotspots, hotspotLoading, fetchHotspots, bbox } = useAppStore()
  const [selectedSats, setSelectedSats] = useState(['TERRA', 'AQUA', 'SNPP', 'NOAA20', 'NOAA21'])

  const toggleSat = (id) => {
    setSelectedSats((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const filteredHotspots = hotspots
    ? hotspots.filter((h) => selectedSats.includes(h.satellite || 'TERRA') || selectedSats.includes(h.sensor))
    : []

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col p-3 space-y-3 bg-bg-primary">
      {/* Top Filter Bar */}
      <div className="bg-bg-secondary border border-border-muted rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Satellite size={18} className="text-ember" />
          <span className="text-sm font-semibold text-text-primary">Satellite Multi-Constellation Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SATELLITE_OPTIONS.map((sat) => {
            const active = selectedSats.includes(sat.id)
            return (
              <button
                key={sat.id}
                onClick={() => toggleSat(sat.id)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg border transition-all font-mono flex items-center gap-1.5',
                  active
                    ? 'bg-ember/20 border-ember text-ember font-semibold'
                    : 'bg-bg-card border-border-muted text-text-muted hover:text-text-primary'
                )}
              >
                <span>{sat.label}</span>
                <span className="text-[10px] opacity-70">({sat.year})</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
          <span>Active Detections: <strong className="text-text-primary">{filteredHotspots.length}</strong></span>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border-muted relative">
        <FireMap customHotspots={filteredHotspots} />
      </div>
    </div>
  )
}

