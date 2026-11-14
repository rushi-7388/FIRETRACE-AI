import React, { useState } from 'react'
import {
  Satellite, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2,
  ChevronDown, ChevronUp, Layers, HelpCircle, Activity, Sparkles, Database
} from 'lucide-react'

export default function NASAMissionBriefing() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border-muted bg-gradient-to-r from-bg-card via-[#111827] to-bg-card p-4 md:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-ember/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember/15 border border-ember/30 flex items-center justify-center text-ember flex-shrink-0 shadow-inner">
            <Satellite size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0B3D91] text-white border border-blue-400/40">
                NASA Space Apps 2026 Challenge
              </span>
              <span className="text-xs font-semibold text-text-primary">
                Problem: Harmonization of MODIS and VIIRS Hot Spots
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                2000–2026 Unbroken Record
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 max-w-3xl leading-relaxed">
              Why direct merging fails: Upgrading from 1000m MODIS to 375m VIIRS created an artificial <strong>+370% fire spike</strong>. FIRETRACE AI mathematically harmonizes both sensors into a unified <strong>Hotspot Density Index (HDI)</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start md:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-surface hover:bg-bg-hover text-text-primary border border-border-muted transition-all whitespace-nowrap cursor-pointer shadow-sm"
        >
          <span>{isExpanded ? 'Hide Mission Architecture' : 'Explain NASA Challenge & Solution'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Collapsible Scientific & Operational Architecture Breakdown */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-border-muted grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200 relative z-10">

          {/* Column 1: The Core Scientific Problem */}
          <div className="p-3.5 rounded-xl bg-bg-secondary/60 border border-border-muted/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <AlertTriangle size={15} />
              <span>1. Why Raw Merging Fails</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              When VIIRS launched in 2012, raw active fire detections surged by <strong>~3.7×</strong> for identical fire fronts. VIIRS's 375m pixel resolves low-intensity agricultural crop clearing beneath tree canopies that 1km MODIS cannot see.
            </p>
            <div className="p-2 rounded bg-bg-surface border border-rose-500/20 text-[10px] text-rose-300 font-mono">
              Raw Merge = False Escalation Alarm! Emergency managers mistake sensor upgrades for real wildfire surges.
            </div>
          </div>

          {/* Column 2: 2026 Suomi-NPP Transition */}
          <div className="p-3.5 rounded-xl bg-bg-secondary/60 border border-border-muted/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Layers size={15} />
              <span>2. NASA FIRMS 2026 Transition</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              NASA officially announced the cessation of <strong>Suomi-NPP</strong> data. FIRETRACE AI seamlessly ingests replacement next-gen <strong>NOAA-20 and NOAA-21 VIIRS</strong> observations, ensuring uninterrupted monitoring past 2026.
            </p>
            <div className="p-2 rounded bg-bg-surface border border-amber-500/20 text-[10px] text-amber-300 font-mono">
              Full Constellation: Terra (2000+) · Aqua (2002+) · S-NPP (2012–2026) · NOAA-20 (2018+) · NOAA-21 (2022+).
            </div>
          </div>

          {/* Column 3: The Mathematical Harmonization */}
          <div className="p-3.5 rounded-xl bg-bg-secondary/60 border border-border-muted/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck size={15} />
              <span>3. The FIRETRACE AI Solution</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              We discretize observations onto a <strong>10 km Sinusoidal Equal-Area Grid</strong>, apply <strong>Collocation Deduplication</strong> (Δd ≤ 1km, Δt ≤ 30min), and calculate the normalized Hotspot Density Index (HDI) using 10-year overlap calibration factor <strong>α(m)</strong>:
            </p>
            <div className="p-2 rounded bg-bg-surface border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
              HDI = [ (N_MODIS + α(m) · N_VIIRS) / Area ] × 1000
            </div>
          </div>

        </div>
      )}

      {/* 2000-2026 Timeline Bar */}
      <div className="mt-4 pt-3 border-t border-border-muted/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-text-muted">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-ember" />
          <span className="text-text-primary font-semibold">Temporal Span:</span>
          <span>January 2000-Present (2026)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sky-400">Terra/Aqua MODIS: 2000–2026</span>
          <span>•</span>
          <span className="text-amber-400">Suomi-NPP VIIRS: 2012–2026</span>
          <span>•</span>
          <span className="text-emerald-400">NOAA-20/21 VIIRS: 2018–2026+</span>
        </div>
      </div>
    </div>
  )
}

