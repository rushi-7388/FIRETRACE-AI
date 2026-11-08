import { useState } from 'react'
import useAppStore from '../../store/useAppStore.js'
import {
  Search, MapPin, Loader2, ChevronDown, Settings,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import ExportButton from '../Export/ExportButton.jsx'

// ─── Year / Month options ─────────────────────────────────────────────────────
const YEARS  = Array.from({ length: 25 }, (_, i) => 2000 + i)
const MONTHS = [
  { v: '01', l: 'Jan' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' },
  { v: '04', l: 'Apr' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun' },
  { v: '07', l: 'Jul' }, { v: '08', l: 'Aug' }, { v: '09', l: 'Sep' },
  { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' },
]

// ─── Region presets ───────────────────────────────────────────────────────────
const REGION_PRESETS = [
  { key: 'surat',      label: '📍 Surat',      bbox: [72.6, 21.0, 73.2, 21.4] },
  { key: 'ahmedabad',  label: '📍 Ahmedabad',  bbox: [72.4, 22.9, 73.0, 23.3] },
  { key: 'mumbai',     label: '📍 Mumbai',      bbox: [72.7, 18.8, 73.1, 19.3] },
  { key: 'amazon',     label: '🌿 Amazon',      bbox: [-62, -10, -50, -2]      },
  { key: 'australia',  label: '🦘 Australia',   bbox: [135, -38, 155, -25]     },
]

// ─── Sensor options ───────────────────────────────────────────────────────────
const SENSOR_OPTIONS = [
  { v: 'modis', l: 'MODIS' },
  { v: 'viirs', l: 'VIIRS' },
  { v: 'both',  l: 'Both (Harmonized)' },
]

// ─── ControlPanel ─────────────────────────────────────────────────────────────
export default function ControlPanel() {
  const { bbox, dateRange, sensor, loading, setBbox, setDateRange, setSensor, fetchHarmonized, fetchHotspots } =
    useAppStore()

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

  const handlePreset = (preset) => {
    setBbox(preset.bbox)
    setBboxInput({
      minLon: preset.bbox[0].toString(),
      minLat: preset.bbox[1].toString(),
      maxLon: preset.bbox[2].toString(),
      maxLat: preset.bbox[3].toString(),
    })
    toast.success(`Region set to ${preset.label.replace(/^.+\s/, '')}`)
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

      {/* ── Region Presets ────────────────────────────────────────── */}
      <section>
        <p className="label-muted mb-2">Quick Regions</p>
        <div className="grid grid-cols-1 gap-1">
          {REGION_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePreset(p)}
              className="text-left text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover
                         px-2.5 py-1.5 rounded-md transition-colors border border-transparent hover:border-border-muted"
            >
              {p.label}
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
