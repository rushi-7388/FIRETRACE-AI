import { useState, useMemo } from 'react'
import useAppStore from '../../store/useAppStore.js'
import {
  Search, MapPin, Loader2, ChevronDown, Settings, Globe, Compass, Flame,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import ExportButton from '../Export/ExportButton.jsx'
import { GLOBAL_LOCATIONS_CATALOG } from '../Map/GlobalLocationSearch.jsx'

// ─── Year / Month options ─────────────────────────────────────────────────────
const YEARS  = Array.from({ length: 27 }, (_, i) => 2000 + i) // 2000 through 2026
const MONTHS = [
  { v: '01', l: 'Jan' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' },
  { v: '04', l: 'Apr' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun' },
  { v: '07', l: 'Jul' }, { v: '08', l: 'Aug' }, { v: '09', l: 'Sep' },
  { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' },
]

// ─── Sensor options ───────────────────────────────────────────────────────────
const SENSOR_OPTIONS = [
  { v: 'modis', l: 'MODIS' },
  { v: 'viirs', l: 'VIIRS' },
  { v: 'both',  l: 'Both (Harmonized)' },
]

// ─── ControlPanel ─────────────────────────────────────────────────────────────
export default function ControlPanel() {
  const {
    bbox, dateRange, sensor, loading,
    setBbox, setDateRange, setSensor,
    fetchHarmonized, fetchHotspots, setBboxAndRefetch,
  } = useAppStore()

  const [bboxInput, setBboxInput] = useState({
    minLon: bbox[0].toString(),
    minLat: bbox[1].toString(),
    maxLon: bbox[2].toString(),
    maxLat: bbox[3].toString(),
  })

  // Parse "YYYY-MM" into { year, month }
  const startParts = dateRange.start.split('-')
  const endParts   = dateRange.end.split('-')

  const handleDateChange = (field, part, value) => {
    const current = field === 'start' ? dateRange.start : dateRange.end
    const [y, m]  = current.split('-')
    const newVal  = part === 'year'  ? `${value}-${m}` : `${y}-${value}`
    setDateRange({ ...dateRange, [field]: newVal })
  }

  const handleBboxInputChange = (key, val) => {
    setBboxInput(prev => ({ ...prev, [key]: val }))
  }

  const applyBboxInput = () => {
    const parsed = [
      parseFloat(bboxInput.minLon),
      parseFloat(bboxInput.minLat),
      parseFloat(bboxInput.maxLon),
      parseFloat(bboxInput.maxLat),
    ]
    if (parsed.some(isNaN)) {
      toast.error('Invalid bbox coordinates')
      return
    }
    setBbox(parsed)
    toast.success('Bbox updated')
  }

  const [selectedContinent, setSelectedContinent] = useState('Asia')

  const displayedLocations = useMemo(() => {
    return GLOBAL_LOCATIONS_CATALOG.filter(l => l.region === selectedContinent || selectedContinent === 'All')
  }, [selectedContinent])

  const handlePreset = (preset) => {
    setBbox(preset.bbox)
    setBboxInput({
      minLon: preset.bbox[0].toString(),
      minLat: preset.bbox[1].toString(),
      maxLon: preset.bbox[2].toString(),
      maxLat: preset.bbox[3].toString(),
    })
    setBboxAndRefetch(preset.bbox, null, preset.name)
    toast.success(`Active AOI set to ${preset.name}`)
  }

  const handleAnalyze = async () => {
    toast.loading('Running analysis…', { id: 'analyze' })
    await Promise.all([fetchHarmonized(), fetchHotspots()])
    toast.success('Analysis complete!', { id: 'analyze' })
  }

  return (
    <aside className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2 border-b border-border-muted">
        <Settings size={15} className="text-ember" />
        <span className="text-sm font-semibold text-text-primary">Analysis Controls</span>
      </div>

      {/* ── Global Biome Presets ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <p className="label-muted flex items-center gap-1">
            <Globe size={11} className="text-ember" />
            Global Fire Biomes
          </p>
          <span className="text-[10px] text-text-muted font-mono">{displayedLocations.length} active</span>
        </div>

        {/* Continent Filter Chips */}
        <div className="flex gap-1 overflow-x-auto pb-1.5 mb-1.5 scrollbar-none">
          {['Asia', 'North America', 'South America', 'Europe', 'Oceania', 'Africa'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedContinent(c)}
              className={clsx(
                'px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors border',
                selectedContinent === c
                  ? 'bg-ember text-white border-ember font-semibold'
                  : 'bg-bg-secondary text-text-muted hover:text-text-primary border-border-muted'
              )}
            >
              {c.replace('North ', 'N. ').replace('South ', 'S. ')}
            </button>
          ))}
        </div>

        {/* Location buttons */}
        <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto border border-border-muted rounded-lg p-1 bg-bg-secondary/40">
          {displayedLocations.map(p => (
            <button
              key={p.name}
              onClick={() => handlePreset(p)}
              className="text-left text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover
                         px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-border-muted flex items-center justify-between group"
            >
              <div className="truncate pr-1">
                <span className="text-text-primary font-medium group-hover:text-ember">{p.name}</span>
                <span className="text-[10px] text-text-muted block">{p.country}</span>
              </div>
              <span className="text-[9px] font-mono text-text-muted bg-bg-card px-1 rounded flex-shrink-0">
                {p.category.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Bbox Inputs ───────────────────────────────────────────── */}
      <section>
        <p className="label-muted mb-2 flex items-center gap-1">
          <MapPin size={11} />
          Bounding Box
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { key: 'minLon', label: 'Min Lon (W)' },
            { key: 'minLat', label: 'Min Lat (S)' },
            { key: 'maxLon', label: 'Max Lon (E)' },
            { key: 'maxLat', label: 'Max Lat (N)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-text-muted mb-0.5 block">{label}</label>
              <input
                type="number"
                step="0.001"
                value={bboxInput[key]}
                onChange={e => handleBboxInputChange(key, e.target.value)}
                className="w-full bg-bg-secondary border border-border-muted text-text-primary text-xs
                           rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ember font-mono"
              />
            </div>
          ))}
        </div>
        <button onClick={applyBboxInput} className="btn-secondary w-full text-xs py-1.5">
          Apply Coordinates
        </button>
        <p className="text-xs text-text-muted mt-1 text-center">or draw on map ↗</p>
      </section>

      {/* ── Date Range ────────────────────────────────────────────── */}
      <section>
        <p className="label-muted mb-2">Date Range</p>
        <div className="space-y-2">
          {[
            { label: 'Start', field: 'start', parts: startParts },
            { label: 'End',   field: 'end',   parts: endParts   },
          ].map(({ label, field, parts }) => (
            <div key={field}>
              <span className="text-xs text-text-muted">{label}</span>
              <div className="flex gap-1.5 mt-1">
                <select
                  value={parts[0]}
                  onChange={e => handleDateChange(field, 'year', e.target.value)}
                  className="select-dark flex-1"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={parts[1]}
                  onChange={e => handleDateChange(field, 'month', e.target.value)}
                  className="select-dark w-20"
                >
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sensor Toggle ─────────────────────────────────────────── */}
      <section>
        <p className="label-muted mb-2">Sensor</p>
        <div className="flex flex-col gap-1">
          {SENSOR_OPTIONS.map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setSensor(v)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium text-left transition-all duration-200 border',
                sensor === v
                  ? 'bg-ember/15 border-ember/50 text-ember'
                  : 'bg-bg-secondary border-border-muted text-text-muted hover:border-ash hover:text-text-primary'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* ── Analyze Button ────────────────────────────────────────── */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="btn-primary w-full mt-auto"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
          : <><Search size={15} /> Analyze</>
        }
      </button>

      {/* ── Export ───────────────────────────────────────────────── */}
      <ExportButton />
    </aside>
  )
}
