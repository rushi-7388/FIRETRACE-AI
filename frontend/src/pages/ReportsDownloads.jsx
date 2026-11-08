import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import { Download, FileText, Globe, Database, FileSpreadsheet, CheckCircle2, Shield } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ReportsDownloads() {
  const { bbox, dateRange, calendarData } = useAppStore()
  const [downloading, setDownloading] = useState(false)

  const triggerDownload = async (format) => {
    setDownloading(true)
    const toastId = toast.loading(`Generating NASA ${format.toUpperCase()} export...`)
    try {
      const response = await axios.post(
        '/api/export/data',
        {
          bbox: bbox.join(','),
          start_date: dateRange.start,
          end_date: dateRange.end,
          format,
        },
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `firetrace_${format}_export.${format === 'pdf_summary' ? 'json' : format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`${format.toUpperCase()} export downloaded!`, { id: toastId })
    } catch (e) {
      toast.error('Download failed — please try again', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-muted pb-4">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Download className="text-ember" size={22} />
          Multi-Format Data Export & Provenance Reports
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Export raw satellite observations, harmonized cell metrics, and executive summaries with verifiable NASA data provenance.
        </p>
      </div>

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CSV */}
        <div className="bg-bg-card border border-border-muted rounded-xl p-4 flex flex-col justify-between">
          <div>
            <FileSpreadsheet size={24} className="text-ember mb-2" />
            <h3 className="text-sm font-semibold text-text-primary">Observation CSV</h3>
            <p className="text-xs text-text-muted mt-1">
              Standard comma-separated format compatible with Excel, QGIS, and ArcGIS. Includes coordinates, FRP, confidence, and satellite tags.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('csv')}
            disabled={downloading}
            className="mt-4 w-full py-2 bg-bg-secondary hover:border-ember border border-border-muted rounded-lg text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Download CSV
          </button>
        </div>

        {/* GeoJSON */}
        <div className="bg-bg-card border border-border-muted rounded-xl p-4 flex flex-col justify-between">
          <div>
            <Globe size={24} className="text-sky-400 mb-2" />
            <h3 className="text-sm font-semibold text-text-primary">Spatial GeoJSON</h3>
            <p className="text-xs text-text-muted mt-1">
              RFC 7946 GeoJSON FeatureCollection. Ready for direct ingestion into Mapbox, Leaflet, PostGIS, and planetary GIS software.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('geojson')}
            disabled={downloading}
            className="mt-4 w-full py-2 bg-bg-secondary hover:border-sky-400 border border-border-muted rounded-lg text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Download GeoJSON
          </button>
        </div>

        {/* JSON */}
        <div className="bg-bg-card border border-border-muted rounded-xl p-4 flex flex-col justify-between">
          <div>
            <Database size={24} className="text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-text-primary">Structured JSON</h3>
            <p className="text-xs text-text-muted mt-1">
              Hierarchical machine-readable payload suitable for developer API pipelines, machine learning models, and automated fire alert webhooks.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('json')}
            disabled={downloading}
            className="mt-4 w-full py-2 bg-bg-secondary hover:border-amber-400 border border-border-muted rounded-lg text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Download JSON
          </button>
        </div>

        {/* PDF Executive Summary */}
        <div className="bg-bg-card border border-border-muted rounded-xl p-4 flex flex-col justify-between">
          <div>
            <FileText size={24} className="text-green-400 mb-2" />
            <h3 className="text-sm font-semibold text-text-primary">Executive Intelligence Report</h3>
            <p className="text-xs text-text-muted mt-1">
              Standardized report summary containing spatial bounds, active fire seasons, total observations, and official NASA methodology disclaimers.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('pdf_summary')}
            disabled={downloading}
            className="mt-4 w-full py-2 bg-bg-secondary hover:border-green-400 border border-border-muted rounded-lg text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Download Summary
          </button>
        </div>
      </div>

      {/* Provenance & Compliance Notice */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-ember" />
          NASA Data Provenance & Citation Standards
        </h3>
        <div className="text-xs text-text-muted space-y-2 leading-relaxed">
          <p>
            Every observation exported by FIRETRACE AI contains exact satellite identifier provenance (Terra, Aqua, S-NPP, NOAA-20, NOAA-21), native confidence rating (MODIS 0-100% vs. VIIRS Low/Nominal/High), and processing classification (NRT vs. Standard Archive).
          </p>
          <div className="p-3 bg-bg-secondary rounded border border-border-muted font-mono text-[11px] text-text-primary">
            Citation Requirement: "We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of the NASA Earth Observing System Data and Information System (EOSDIS)."
          </div>
        </div>
      </div>
    </div>
  )
}

