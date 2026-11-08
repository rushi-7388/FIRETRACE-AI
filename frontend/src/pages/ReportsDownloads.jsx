import { useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore.js'
import { Download, FileText, Globe, Database, FileSpreadsheet, CheckCircle2, Shield, Activity, Satellite, Clock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ReportsDownloads() {
  const { bbox, dateRange, calendarData } = useAppStore()
  const [downloading, setDownloading] = useState(false)
  const [provenance, setProvenance] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)

  useEffect(() => {
    axios.get('/api/provenance')
      .then(res => setProvenance(res.data))
      .catch(() => {})

    axios.get('/api/status')
      .then(res => setSystemStatus(res.data))
      .catch(() => {})
  }, [])

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
      const ext = format === 'pdf_summary' ? 'pdf' : format
      link.setAttribute('download', `firetrace_${format}_export.${ext}`)
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
      {/* Header with Live Status Badge */}
      <div className="border-b border-border-muted pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Download className="text-ember" size={22} />
            Regional Intelligence Reports & Satellite Data Quality Monitor
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Generate reproducible multi-format intelligence reports (PDF/CSV/GeoJSON) and monitor satellite ingestion freshness, coverage, and provenance.
          </p>
        </div>
        {systemStatus && (
          <div className="flex items-center gap-2 bg-bg-card border border-border-muted rounded-lg px-3 py-1.5 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-text-muted">ENGINE:</span>
            <span className="text-ember font-bold">{systemStatus.nasa_firms_mode}</span>
          </div>
        )}
      </div>

      {/* ── Feature 4: Satellite Data Quality Monitor KPI Cards ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="stat-card">
          <div className="label-muted">Data Freshness / Latency</div>
          <div className="text-lg font-bold text-green-400 mt-1">&lt; 3.2 Hours</div>
          <div className="text-[11px] text-text-muted font-sans mt-0.5">NASA NRT orbital pass ingestion</div>
        </div>
        <div className="stat-card">
          <div className="label-muted">Processing Versions</div>
          <div className="text-lg font-bold text-text-primary mt-1">SP Archive + NRT</div>
          <div className="text-[11px] text-text-muted font-sans mt-0.5">Standard science archive (&gt;90d)</div>
        </div>
        <div className="stat-card">
          <div className="label-muted">Active Constellation</div>
          <div className="text-lg font-bold text-ember mt-1">5 Satellites</div>
          <div className="text-[11px] text-text-muted font-sans mt-0.5">Terra, Aqua, S-NPP, NOAA-20, NOAA-21</div>
        </div>
        <div className="stat-card">
          <div className="label-muted">Missing vs Zero Fire</div>
          <div className="text-lg font-bold text-sky-400 mt-1">QC Differentiated</div>
          <div className="text-[11px] text-text-muted font-sans mt-0.5">Cloud obstruction vs true zero burn</div>
        </div>
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
              Official PDF executive report containing spatial bounds, active fire seasons, total observations, and official NASA methodology disclaimers.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('pdf_summary')}
            disabled={downloading}
            className="mt-4 w-full py-2 bg-bg-secondary hover:border-green-400 border border-border-muted rounded-lg text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Download Official PDF
          </button>
        </div>
      </div>

      {/* Live Data Provenance & Sensor Constellation Inventory */}
      {provenance && (
        <div className="bg-bg-card border border-border-muted rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Satellite size={16} className="text-ember" />
              Registered Satellite & Sensor Constellation
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              NASA MAP_KEY Secured Server-Side
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {provenance.satellites?.map(sat => (
              <div key={sat.satellite_id} className="bg-bg-secondary border border-border-muted rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold text-text-primary">{sat.name}</div>
                <div className="text-text-muted text-[11px]">Agency: <span className="text-ember">{sat.agency}</span></div>
                <div className="text-text-muted text-[11px]">Launch: {sat.launch_date}</div>
                <div className="text-[10px] text-green-400 font-mono">STATUS: {sat.status.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Ingestion Audit Trail */}
          {provenance.recent_ingestion_logs && provenance.recent_ingestion_logs.length > 0 && (
            <div className="space-y-2 mt-4 pt-3 border-t border-border-muted">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Clock size={14} className="text-ember" />
                Recent Ingestion Audit Log (Database Provenance Records)
              </div>
              <div className="overflow-x-auto max-h-48 border border-border-muted rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bg-secondary text-text-muted border-b border-border-muted text-[11px]">
                    <tr>
                      <th className="p-2">Log ID</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Span</th>
                      <th className="p-2">Detections</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted text-[11px]">
                    {provenance.recent_ingestion_logs.map(log => (
                      <tr key={log.log_id} className="hover:bg-bg-hover">
                        <td className="p-2 text-text-muted">#{log.log_id}</td>
                        <td className="p-2 text-text-primary font-semibold">{log.product}</td>
                        <td className="p-2 text-text-muted">{log.date_start} → {log.date_end}</td>
                        <td className="p-2 text-ember font-bold">{log.records_retrieved.toLocaleString()}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2 text-text-muted">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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

