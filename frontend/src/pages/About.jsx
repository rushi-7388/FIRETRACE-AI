import { Satellite, Database, Info, ExternalLink, Flame, CheckCircle } from 'lucide-react'
import Logo from '../components/Brand/Logo.jsx'

// ─── Data Sources ─────────────────────────────────────────────────────────────
const DATA_SOURCES = [
  {
    name: 'NASA FIRMS',
    url: 'https://firms.modaps.eosdis.nasa.gov/',
    desc: 'Fire Information for Resource Management System - real-time and historical fire detection.',
  },
  {
    name: 'MODIS (Terra & Aqua)',
    url: 'https://modis.gsfc.nasa.gov/',
    desc: 'MOD14/MYD14 Active Fire products at 1 km resolution since 2000.',
  },
  {
    name: 'VIIRS (Suomi-NPP & NOAA-20)',
    url: 'https://www.nasa.gov/viirs',
    desc: 'VNP14IMGT Active Fire product at 375 m resolution since 2012.',
  },
]

// ─── How HDI Works steps ──────────────────────────────────────────────────────
const HDI_STEPS = [
  {
    step: '1',
    title: 'Raw Counts',
    desc: 'Collect monthly fire detection counts for MODIS (1 km, 2× daily) and VIIRS (375 m, 2× daily) in the AOI.',
  },
  {
    step: '2',
    title: 'Cross-Calibration',
    desc: 'Apply a linear regression to align the VIIRS detection rate to MODIS scale over the overlap period (2012-present), correcting for spatial resolution bias.',
  },
  {
    step: '3',
    title: 'Gap Filling',
    desc: 'For pre-2012 periods (MODIS only), use the calibrated relationship to estimate what VIIRS would have detected, extending the record back to 2000.',
  },
  {
    step: '4',
    title: 'HDI Computation',
    desc: 'Compute Hotspot Density Index = harmonized count / AOI area in km². This normalizes across different AOI sizes.',
  },
  {
    step: '5',
    title: 'Anomaly Detection',
    desc: 'Compute Z-score = (HDI − historical monthly median) / historical monthly IQR. Months with |z| > 2 are flagged as anomalies.',
  },
]

// ─── About ────────────────────────────────────────────────────────────────────
export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10 animate-fade-in min-h-[calc(100vh-56px)] pb-16">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="text-center">
        <div className="flex justify-center mb-5">
          <Logo size={72} />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          FireTrace AI
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">
          A NASA Space Apps 2026 project harmonizing MODIS and VIIRS satellite fire hotspot data
          into a unified burning activity calendar.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-ember/10 border border-ember/30 rounded-full px-4 py-1.5 text-ember text-sm">
          <Satellite size={14} />
          NASA Space Apps Challenge 2026
        </div>
      </section>

      {/* ── Sensor Comparison Table ───────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Satellite size={20} className="text-ember" />
          MODIS vs VIIRS - Sensor Comparison
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border-muted">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-hover border-b border-border-muted">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Property</th>
                <th className="text-left px-4 py-3 text-blue-400 font-semibold">MODIS</th>
                <th className="text-left px-4 py-3 text-orange-400 font-semibold">VIIRS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {[
                ['Full name', 'Moderate Resolution Imaging Spectroradiometer', 'Visible Infrared Imaging Radiometer Suite'],
                ['Platforms', 'Terra (1999), Aqua (2002)', 'Suomi-NPP (2012), NOAA-20 (2018)'],
                ['Spatial resolution', '~1 km (1,000 m)', '~375 m (sub-pixel algorithm)'],
                ['Overpass frequency', '2× daily per satellite (4× combined)', '2× daily per satellite'],
                ['Fire product', 'MOD14 / MYD14 Collection 6.1', 'VNP14IMGT / VJ114IMGV2'],
                ['FRP accuracy', 'Good for large fires', 'Better for small and cool fires'],
                ['Record start', '2000-02 (Terra)', '2012-01 (Suomi-NPP)'],
                ['Resolution bias', 'May miss small fires (<1 km²)', 'Detects fires missed by MODIS'],
              ].map(([prop, modis, viirs]) => (
                <tr key={prop} className="bg-bg-card hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 text-text-muted font-medium">{prop}</td>
                  <td className="px-4 py-3 text-text-primary">{modis}</td>
                  <td className="px-4 py-3 text-text-primary">{viirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Why Harmonization ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Info size={20} className="text-ember" />
          Why Harmonization is Needed
        </h2>
        <div className="card space-y-3 text-sm text-text-muted leading-relaxed">
          <p>
            MODIS and VIIRS use different sensors, resolutions, and detection algorithms.
            When you simply count detections from both sensors, you get a <strong className="text-text-primary">systematic bias</strong>:
            VIIRS detects approximately <strong className="text-orange-400">2–4× more fires</strong> than MODIS in the same area,
            because its 375 m pixels can resolve smaller fire fronts.
          </p>
          <p>
            This means a naive union of MODIS (2000–present) and VIIRS (2012–present) data would show
            an artificial "jump" in fire activity around 2012, when VIIRS data begins. This is
            <strong className="text-red-400"> not a real increase</strong> in fire frequency - it's a sensor artifact.
          </p>
          <p>
            FireTrace AI applies a cross-calibration algorithm to bring both sensors onto a common scale,
            producing the <strong className="text-glow">Hotspot Density Index (HDI)</strong> - a consistent,
            comparable measure of burning activity from 2000 to the present.
          </p>
        </div>
      </section>

      {/* ── How HDI Works ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Flame size={20} className="text-ember" />
          How the HDI Algorithm Works
        </h2>
        <div className="space-y-3">
          {HDI_STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 card">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ember/15 border border-ember/30
                              flex items-center justify-center text-ember text-xs font-bold mt-0.5">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Database size={20} className="text-ember" />
          Data Sources
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DATA_SOURCES.map(({ name, url, desc }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="card hover:border-ember/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-text-primary text-sm group-hover:text-ember transition-colors">
                  {name}
                </span>
                <ExternalLink size={13} className="text-text-muted group-hover:text-ember transition-colors flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────── */}
      <section className="pb-8">
        <h2 className="text-xl font-bold text-text-primary mb-4">Team</h2>
        <div className="card text-sm text-text-muted space-y-2">
          <p>
            <strong className="text-text-primary">FireTrace AI</strong> was built for the
            NASA Space Apps Challenge 2026 by a team passionate about remote sensing,
            wildfire science, and open data.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['Remote Sensing', 'Fire Ecology', 'Data Harmonization', 'Open Source'].map(tag => (
              <span key={tag} className="bg-ember/10 border border-ember/20 text-ember text-xs px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
