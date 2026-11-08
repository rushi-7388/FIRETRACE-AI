import { Download, FileText, Image } from 'lucide-react'
import useAppStore from '../../store/useAppStore.js'
import toast from 'react-hot-toast'

// ─── CSV Serializer ───────────────────────────────────────────────────────────
function dataToCSV(rows) {
  if (!rows || rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        return val == null ? '' : typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

// ─── Trigger browser download ─────────────────────────────────────────────────
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── ExportButton ─────────────────────────────────────────────────────────────
export default function ExportButton() {
  const { calendarData, bbox, dateRange, sensor } = useAppStore()

  const handleCSVDownload = async () => {
    if (!calendarData || calendarData.length === 0) {
      toast.error('No data to export - run analysis first')
      return
    }

    try {
      // Try the API endpoint first
      const params = new URLSearchParams({
        min_lon: bbox[0],
        min_lat: bbox[1],
        max_lon: bbox[2],
        max_lat: bbox[3],
        start_date: dateRange.start,
        end_date: dateRange.end,
        sensor,
      })

      const response = await fetch(`/api/export/csv?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `firetrace_export_${dateRange.start}_${dateRange.end}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('CSV exported!')
        return
      }
    } catch (_) {
      // Fall back to client-side CSV
    }

    // Client-side fallback
    const csv = dataToCSV(calendarData)
    triggerDownload(
      csv,
      `firetrace_harmonized_${dateRange.start}_to_${dateRange.end}.csv`,
      'text/csv;charset=utf-8;'
    )
    toast.success('CSV downloaded!')
  }

  const handlePNGDownload = async () => {
    toast.loading('Capturing chart…', { id: 'png' })
    try {
      // Find the main content area
      const target = document.querySelector('#firetrace-main-content')
      if (!target) {
        toast.error('Could not find chart area', { id: 'png' })
        return
      }

      // Use html2canvas if available, else canvas API screenshot
      if (typeof window.html2canvas !== 'undefined') {
        const canvas = await window.html2canvas(target, {
          backgroundColor: '#0D1117',
          useCORS: true,
          scale: 2,
        })
        canvas.toBlob(blob => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `firetrace_snapshot_${new Date().toISOString().slice(0, 10)}.png`
          a.click()
          URL.revokeObjectURL(url)
          toast.success('PNG exported!', { id: 'png' })
        })
      } else {
        // Fallback: export SVG calendar
        const svgEl = document.querySelector('#firetrace-main-content svg')
        if (!svgEl) {
          toast.error('No SVG chart found', { id: 'png' })
          return
        }
        const svgData = new XMLSerializer().serializeToString(svgEl)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `firetrace_calendar_${new Date().toISOString().slice(0, 10)}.svg`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('SVG exported!', { id: 'png' })
      }
    } catch (err) {
      toast.error(`Export failed: ${err.message}`, { id: 'png' })
    }
  }

  return (
    <div className="flex gap-2 mt-1">
      <button onClick={handleCSVDownload} className="btn-secondary flex-1 text-xs py-1.5">
        <FileText size={13} />
        CSV
      </button>
      <button onClick={handlePNGDownload} className="btn-secondary flex-1 text-xs py-1.5">
        <Image size={13} />
        PNG
      </button>
    </div>
  )
}
