import { useState, useEffect, useRef, useMemo } from 'react'
import useAppStore from '../store/useAppStore.js'
import FireMap from '../components/Map/FireMap.jsx'
import {
  Satellite, Flame, Play, Pause, RotateCcw, FastForward,
  AlertTriangle, ShieldAlert, Calendar, Eye, Compass
} from 'lucide-react'
import clsx from 'clsx'

const SATELLITE_OPTIONS = [
  { id: 'TERRA', label: 'Terra (MODIS)', year: '2000+' },
  { id: 'AQUA', label: 'Aqua (MODIS)', year: '2002+' },
  { id: 'SNPP', label: 'Suomi-NPP (VIIRS)', year: '2012+' },
  { id: 'NOAA20', label: 'NOAA-20 (VIIRS)', year: '2018+' },
  { id: 'NOAA21', label: 'NOAA-21 (VIIRS)', year: '2022+' },
]

export default function GlobalFireMap() {
  const { hotspots, fetchHotspots, bbox, setBbox } = useAppStore()
  const [selectedSats, setSelectedSats] = useState(['TERRA', 'AQUA', 'SNPP', 'NOAA20', 'NOAA21'])

  // Timeline playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // ms per step
  const [isCumulative, setIsCumulative] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!hotspots || hotspots.length === 0) {
      fetchHotspots()
    }
  }, [])

  // Extract unique sorted dates from hotspots
  const uniqueDates = useMemo(() => {
    if (!hotspots || hotspots.length === 0) return []
    const dates = Array.from(new Set(hotspots.map((h) => h.date || h.acq_date).filter(Boolean)))
    return dates.sort()
  }, [hotspots])

  // Reset playback if dates change
  useEffect(() => {
    if (uniqueDates.length > 0 && playbackIndex >= uniqueDates.length) {
      setPlaybackIndex(uniqueDates.length - 1)
    }
  }, [uniqueDates])

  // Playback loop
  useEffect(() => {
    if (isPlaying && uniqueDates.length > 0) {
      timerRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= uniqueDates.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, playbackSpeed)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playbackSpeed, uniqueDates.length])

  const toggleSat = (id) => {
    setSelectedSats((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  // Filter by selected satellites and timeline date
  const filteredHotspots = useMemo(() => {
    if (!hotspots) return []
    let list = hotspots.filter(
      (h) => selectedSats.includes(h.satellite || 'TERRA') || selectedSats.includes(h.sensor)
    )

    if (uniqueDates.length > 0) {
      const currentDate = uniqueDates[playbackIndex]
      if (isCumulative) {
        list = list.filter((h) => (h.date || h.acq_date) <= currentDate)
      } else {
        list = list.filter((h) => (h.date || h.acq_date) === currentDate)
      }
    }

    return list
  }, [hotspots, selectedSats, uniqueDates, playbackIndex, isCumulative])

  // Fire Danger Rating calculation
  const fireDanger = useMemo(() => {
    const count = filteredHotspots.length
    if (count > 80) return { label: 'CRITICAL BURNING PERIOD', color: 'text-red-500 bg-red-500/10 border-red-500/30', level: 'Extreme' }
    if (count > 30) return { label: 'HIGH FIRE ACTIVITY', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', level: 'Elevated' }
    if (count > 10) return { label: 'MODERATE BURNING', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', level: 'Moderate' }
    return { label: 'LOW FIRE ACTIVITY', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', level: 'Low' }
  }, [filteredHotspots.length])

  const currentDate = uniqueDates[playbackIndex] || 'All Observations'

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col p-3 space-y-2 bg-bg-primary">
      {/* Top Bar: Satellite Multi-Constellation Filter & Live Danger Rating */}
      <div className="bg-bg-secondary border border-border-muted rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Satellite size={16} className="text-ember" />
          <span className="text-xs font-semibold text-text-primary">Constellation:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SATELLITE_OPTIONS.map((sat) => {
              const active = selectedSats.includes(sat.id)
              return (
                <button
                  key={sat.id}
                  onClick={() => toggleSat(sat.id)}
                  className={clsx(
                    'text-[11px] px-2.5 py-1 rounded-md border transition-all font-mono flex items-center gap-1',
                    active
                      ? 'bg-ember/20 border-ember text-ember font-semibold'
                      : 'bg-bg-card border-border-muted text-text-muted hover:text-text-primary'
                  )}
                >
                  <span>{sat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Early Warning Badge */}
        <div className="flex items-center gap-3">
          <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-semibold', fireDanger.color)}>
            <ShieldAlert size={14} className="animate-pulse" />
            <span>{fireDanger.label}</span>
          </div>
          <div className="text-xs font-mono text-text-muted">
            Active: <strong className="text-ember">{filteredHotspots.length}</strong> / {hotspots?.length || 0}
          </div>
        </div>
      </div>

      {/* Main Map with Leaflet Layer */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border-muted relative min-h-0">
        <FireMap customHotspots={filteredHotspots} />
      </div>

      {/* Interactive Timeline Playback Scrubber */}
      {uniqueDates.length > 0 && (
        <div className="bg-bg-secondary border border-border-muted rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-ember text-black hover:bg-ember/90 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false)
                setPlaybackIndex(0)
              }}
              className="p-1.5 bg-bg-card border border-border-muted hover:border-ember text-text-muted hover:text-text-primary rounded-lg transition-colors"
              title="Reset Timeline"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => setIsCumulative(!isCumulative)}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1',
                isCumulative
                  ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                  : 'bg-bg-card border-border-muted text-text-muted hover:text-text-primary'
              )}
              title="Toggle between cumulative history and single-day window"
            >
              <Eye size={12} />
              <span>{isCumulative ? 'Cumulative' : 'Single Day'}</span>
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1 bg-bg-card border border-border-muted rounded-lg p-0.5">
              {[
                { label: '1x', ms: 1200 },
                { label: '2x', ms: 600 },
                { label: '4x', ms: 250 },
              ].map(({ label, ms }) => (
                <button
                  key={label}
                  onClick={() => setPlaybackSpeed(ms)}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-colors',
                    playbackSpeed === ms
                      ? 'bg-ember text-black'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="flex-1 min-w-[200px] flex items-center gap-3">
            <Calendar size={14} className="text-ember flex-shrink-0" />
            <input
              type="range"
              min={0}
              max={uniqueDates.length - 1}
              value={playbackIndex}
              onChange={(e) => {
                setIsPlaying(false)
                setPlaybackIndex(Number(e.target.value))
              }}
              className="w-full accent-ember cursor-pointer"
            />
          </div>

          {/* Current Date HUD */}
          <div className="flex items-center gap-2 bg-bg-card border border-border-muted px-3 py-1 rounded-lg">
            <span className="text-text-muted">Observation Date:</span>
            <span className="text-ember font-bold text-sm">{currentDate}</span>
            <span className="text-[10px] text-text-muted">({playbackIndex + 1}/{uniqueDates.length})</span>
          </div>
        </div>
      )}
    </div>
  )
}

