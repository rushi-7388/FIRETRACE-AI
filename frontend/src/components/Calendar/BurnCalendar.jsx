import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import useAppStore from '../../store/useAppStore.js'
import { hdiToColor, hdiToColorPercentile, YL_OR_RD } from '../../utils/colors.js'
import { formatDate, formatHDI, formatZScore, monthSingle } from '../../utils/format.js'
import { Flame } from 'lucide-react'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CalendarSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <div className="skeleton h-5 w-64 mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-1.5">
          <div className="skeleton h-5 w-10 flex-shrink-0" />
          {Array.from({ length: 12 }).map((_, j) => (
            <div key={j} className="skeleton h-5 flex-1" />
          ))}
        </div>
      ))}
      <div className="skeleton h-4 w-48 mt-4" />
    </div>
  )
}

// ─── Main BurnCalendar ────────────────────────────────────────────────────────
export default function BurnCalendar() {
  const svgRef      = useRef(null)
  const tooltipRef  = useRef(null)
  const containerRef = useRef(null)

  const calendarData = useAppStore(s => s.calendarData)
  const loading      = useAppStore(s => s.loading)

  const [dims, setDims] = useState({ width: 800, height: 400 })

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      setDims(d => ({ ...d, width: Math.max(400, width) }))
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!calendarData || calendarData.length === 0 || !svgRef.current) return

    const margin = { top: 36, right: 20, bottom: 60, left: 52 }
    const totalW = dims.width
    const MONTHS = 12

    // Get unique sorted years
    const years = Array.from(new Set(calendarData.map(d => d.year))).sort((a, b) => a - b)
    const nYears = years.length

    const cellW   = Math.floor((totalW - margin.left - margin.right) / MONTHS)
    const cellH   = Math.min(22, Math.max(14, Math.floor((dims.height - margin.top - margin.bottom - 50) / nYears)))
    const innerH  = cellH * nYears
    const totalH  = innerH + margin.top + margin.bottom + 44  // 44 for legend

    // Max HDI for color scale
    const maxHdi = d3.max(calendarData, d => d.hdi) || 1

    // Build lookup: year-month → row
    const lookup = {}
    calendarData.forEach(d => { lookup[`${d.year}-${d.month}`] = d })

    // Percentile scale
    const sortedHdi = calendarData.map(d => d.hdi).filter(v => v > 0).sort(d3.ascending)
    const pctScale  = d3.scaleQuantile().domain(sortedHdi).range(d3.range(0, 1.001, 1 / 8))

    // ── Clear & build SVG ────────────────────────────────────
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', totalW).attr('height', totalH)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // ── Title ────────────────────────────────────────────────
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', 20)
      .attr('fill', '#E6EDF3')
      .attr('font-size', 13)
      .attr('font-weight', 600)
      .attr('font-family', 'Inter, sans-serif')
      .text('Burning Activity Calendar — Hotspot Density Index (HDI)')

    // ── Month header (X-axis) ────────────────────────────────
    const monthLabels = ['J','F','M','A','M','J','J','A','S','O','N','D']
    monthLabels.forEach((lbl, i) => {
      g.append('text')
        .attr('x', i * cellW + cellW / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7D8590')
        .attr('font-size', 11)
        .attr('font-family', 'Inter, sans-serif')
        .text(lbl)
    })

    // ── Year labels (Y-axis) ─────────────────────────────────
    years.forEach((year, yi) => {
      g.append('text')
        .attr('x', -6)
        .attr('y', yi * cellH + cellH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#7D8590')
        .attr('font-size', 10)
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(year)
    })

    // ── Cells ────────────────────────────────────────────────
    const tooltip = d3.select(tooltipRef.current)

    years.forEach((year, yi) => {
      for (let m = 1; m <= MONTHS; m++) {
        const row = lookup[`${year}-${m}`]
        const hdi = row?.hdi ?? 0
        const pct = hdi > 0 ? (pctScale(hdi) ?? 0) : 0
        const color = hdi > 0 ? hdiToColorPercentile(pct) : '#1A1F26'

        const cell = g.append('rect')
          .attr('class', 'cal-cell')
          .attr('x', (m - 1) * cellW + 1)
          .attr('y', yi * cellH + 1)
          .attr('width',  cellW - 2)
          .attr('height', cellH - 2)
          .attr('rx', 2)
          .attr('fill', color)
          .attr('stroke', row?.is_anomaly ? '#00FFFF' : 'none')
          .attr('stroke-width', row?.is_anomaly ? 1.5 : 0)
          .style('cursor', 'pointer')

        // Hover events
        cell
          .on('mouseover', function(event) {
            d3.select(this)
              .attr('stroke', row?.is_anomaly ? '#00FFFF' : '#E6EDF3')
              .attr('stroke-width', 1.5)
              .attr('opacity', 0.85)

            if (!row) return

            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            tooltip
              .style('display', 'block')
              .html(`
                <div style="font-weight:600;color:#E6EDF3;margin-bottom:6px;">
                  🔥 ${monthNames[m-1]} ${year}
                  ${row.is_anomaly ? '<span style="color:#00FFFF;font-size:10px;margin-left:4px;">⚡ ANOMALY</span>' : ''}
                </div>
                <div style="color:#7D8590;font-size:11px;line-height:1.8;">
                  <div>HDI: <span style="color:#FEB24C;font-weight:600;">${formatHDI(row.hdi)}</span></div>
                  <div>Z-Score: <span style="color:${Math.abs(row.z_score) > 2 ? '#FC4E2A' : '#A8DDB5'};font-weight:600;">${formatZScore(row.z_score)}</span></div>
                  <div>MODIS count: <span style="color:#E6EDF3;">${row.modis_count ?? '—'}</span></div>
                  <div>VIIRS count: <span style="color:#E6EDF3;">${row.viirs_count ?? '—'}</span></div>
                  <div>Harmonized: <span style="color:#E6EDF3;">${row.harmonized_count ?? '—'}</span></div>
                  <div>Hist. median: <span style="color:#E6EDF3;">${formatHDI(row.historical_median)}</span></div>
                </div>
              `)
          })
          .on('mousemove', function(event) {
            const svgRect = svgRef.current.getBoundingClientRect()
            const x = event.clientX - svgRect.left + 14
            const y = event.clientY - svgRect.top - 10
            tooltip
              .style('left', `${x}px`)
              .style('top',  `${y}px`)
          })
          .on('mouseleave', function() {
            d3.select(this)
              .attr('stroke', row?.is_anomaly ? '#00FFFF' : 'none')
              .attr('stroke-width', row?.is_anomaly ? 1.5 : 0)
              .attr('opacity', 1)
            tooltip.style('display', 'none')
          })
      }
    })

    // ── Color legend bar ─────────────────────────────────────
    const legendY   = innerH + 24
    const legendW   = Math.min(300, totalW - margin.left - margin.right - 80)
    const legendH   = 10
    const legendX   = 0

    const defs = svg.append('defs')
    const gradId = 'hdiGrad'
    const grad = defs.append('linearGradient').attr('id', gradId)
    YL_OR_RD.forEach((color, i) => {
      grad.append('stop')
        .attr('offset', `${(i / (YL_OR_RD.length - 1)) * 100}%`)
        .attr('stop-color', color)
    })

    // "No data" swatch
    g.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendH)
      .attr('height', legendH)
      .attr('rx', 2)
      .attr('fill', '#1A1F26')
      .attr('stroke', '#30363D')
      .attr('stroke-width', 0.5)

    g.append('text')
      .attr('x', legendX + legendH + 4)
      .attr('y', legendY + legendH - 1)
      .attr('fill', '#7D8590')
      .attr('font-size', 10)
      .text('No data')

    g.append('rect')
      .attr('x', legendX + 60)
      .attr('y', legendY)
      .attr('width', legendW)
      .attr('height', legendH)
      .attr('rx', 2)
      .attr('fill', `url(#${gradId})`)

    g.append('text')
      .attr('x', legendX + 60)
      .attr('y', legendY + legendH + 14)
      .attr('fill', '#7D8590')
      .attr('font-size', 10)
      .text('Low HDI')

    g.append('text')
      .attr('x', legendX + 60 + legendW)
      .attr('y', legendY + legendH + 14)
      .attr('text-anchor', 'end')
      .attr('fill', '#7D8590')
      .attr('font-size', 10)
      .text('High HDI')

    // Anomaly legend
    g.append('rect')
      .attr('x', legendX + 60 + legendW + 24)
      .attr('y', legendY)
      .attr('width', 14)
      .attr('height', legendH)
      .attr('rx', 2)
      .attr('fill', '#FC4E2A')
      .attr('stroke', '#00FFFF')
      .attr('stroke-width', 1.5)

    g.append('text')
      .attr('x', legendX + 60 + legendW + 42)
      .attr('y', legendY + legendH - 1)
      .attr('fill', '#7D8590')
      .attr('font-size', 10)
      .text('Anomaly (|z| > 2)')

  }, [calendarData, dims])

  if (loading) return <CalendarSkeleton />

  if (!calendarData || calendarData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-3">
        <Flame size={36} className="text-border-muted" />
        <p className="text-sm">No calendar data yet. Hit <strong className="text-ember">Analyze</strong> to load data.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      {/* D3 Tooltip */}
      <div
        ref={tooltipRef}
        className="d3-tooltip"
        style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
      />
      <svg ref={svgRef} className="block" />
    </div>
  )
}
