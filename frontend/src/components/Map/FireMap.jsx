import { useEffect, useRef, useCallback, useState } from 'react'
import { MapContainer, TileLayer, useMap, FeatureGroup, CircleMarker, Popup, Rectangle, ZoomControl, GeoJSON } from 'react-leaflet'
import L from '../../utils/leaflet-setup.js'
import useAppStore from '../../store/useAppStore.js'
import { frpToColor, frpToRadius } from '../../utils/colors.js'
import { formatDate } from '../../utils/format.js'
import { MapPin, Crosshair, Layers, Upload, Sliders, CheckCircle2, ShieldCheck, Flame, Compass, Globe, Sparkles, Target } from 'lucide-react'
import clsx from 'clsx'
import GlobalLocationSearch from './GlobalLocationSearch.jsx'

// ─── GeoJSON Bbox Calculation ────────────────────────────────────────────────
function getGeoJsonBbox(geojson) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity
  function traverse(coords) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lon, lat] = coords
      if (lon < minLon) minLon = lon
      if (lat < minLat) minLat = lat
      if (lon > maxLon) maxLon = lon
      if (lat > maxLat) maxLat = lat
    } else if (Array.isArray(coords)) {
      coords.forEach(traverse)
    }
  }
  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features.forEach(f => traverse(f.geometry?.coordinates))
  } else if (geojson.geometry) {
    traverse(geojson.geometry.coordinates)
  } else if (geojson.coordinates) {
    traverse(geojson.coordinates)
  }
  if (minLon === Infinity) return null
  return [minLon, minLat, maxLon, maxLat]
}

function calculateBboxAreaKm2([w, s, e, n]) {
  const dLat = Math.abs(n - s) * 111.0
  const meanLat = (s + n) / 2.0
  const dLon = Math.abs(e - w) * 111.0 * Math.cos(meanLat * Math.PI / 180)
  return Math.round(dLat * dLon)
}

// Ray-casting point-in-polygon verification for irregular AOI boundaries
function isPointInRing([lon, lat], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function isHotspotInGeoJson(lat, lon, geojson) {
  if (!geojson) return true
  try {
    const pt = [lon, lat]
    const features = geojson.type === 'FeatureCollection' ? geojson.features : (geojson.type === 'Feature' ? [geojson] : [{ geometry: geojson }])
    for (const f of features) {
      const geom = f.geometry || f
      if (geom.type === 'Polygon') {
        if (isPointInRing(pt, geom.coordinates[0])) return true
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (isPointInRing(pt, poly[0])) return true
        }
      }
    }
    return false
  } catch {
    return true
  }
}

// ─── Gujarat approximate outline polygon ─────────────────────────────────────
const GUJARAT_OUTLINE = [
  [24.7, 68.1], [24.7, 70.0], [23.6, 68.3], [22.8, 68.5],
  [22.3, 69.2], [22.0, 70.0], [20.8, 71.0], [20.5, 72.6],
  [20.9, 73.1], [21.1, 73.0], [21.5, 72.5], [22.0, 72.5],
  [22.3, 73.0], [22.6, 73.2], [23.0, 73.0], [23.3, 72.6],
  [23.6, 72.4], [24.0, 72.5], [24.1, 71.5], [24.5, 70.9],
  [24.7, 70.3], [24.7, 68.1],
]

// ─── Region presets ───────────────────────────────────────────────────────────
const REGION_PRESETS = {
  surat: { bbox: [72.6, 21.0, 73.2, 21.4], label: 'Surat', center: [21.17, 72.83], zoom: 10 },
  ahmedabad: { bbox: [72.4, 22.9, 73.0, 23.3], label: 'Ahmedabad', center: [23.03, 72.59], zoom: 10 },
  gujarat: { bbox: [68.1, 20.1, 74.5, 24.7], label: 'Gujarat', center: [22.26, 71.19], zoom: 7 },
  amazon: { bbox: [-62, -10, -50, -2], label: 'Amazon', center: [-6, -56], zoom: 5 },
  australia: { bbox: [135, -38, 155, -25], label: 'Australia', center: [-32, 145], zoom: 5 },
}



// ─── DrawControl component ────────────────────────────────────────────────────
function DrawControl({ onBboxChange }) {
  const map = useMap()
  const drawRef = useRef(null)

  useEffect(() => {
    let active = true

    async function initDraw() {
      if (typeof window !== 'undefined') {
        window.L = L
        globalThis.L = L
      }

      if (!L?.Control?.Draw) {
        try {
          await import('leaflet-draw')
        } catch (e) {
          console.warn('Leaflet draw load:', e)
        }
      }

      if (!active) return
      const DrawClass = L?.Control?.Draw || (typeof window !== 'undefined' && window.L?.Control?.Draw)
      if (!DrawClass) return

      try {
        const drawnItems = new L.FeatureGroup()
        map.addLayer(drawnItems)

        const drawControl = new DrawClass({
          edit: { featureGroup: drawnItems },
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: { color: '#FF4500', weight: 2, fillOpacity: 0.25 },
            },
            rectangle: {
              shapeOptions: { color: '#FF4500', weight: 2, fillOpacity: 0.2 },
            },
            circle: false,
            marker: false,
            polyline: false,
            circlemarker: false,
          },
        })
        map.addControl(drawControl)
        drawRef.current = { drawControl, drawnItems }

        const createdEvent = L?.Draw?.Event?.CREATED || (typeof window !== 'undefined' && window.L?.Draw?.Event?.CREATED) || 'draw:created'

        const handleCreated = (e) => {
          drawnItems.clearLayers()
          drawnItems.addLayer(e.layer)
          const bounds = e.layer.getBounds()
          const west = parseFloat(bounds.getWest().toFixed(4))
          const south = parseFloat(bounds.getSouth().toFixed(4))
          const east = parseFloat(bounds.getEast().toFixed(4))
          const north = parseFloat(bounds.getNorth().toFixed(4))
          const bbox = [west, south, east, north]

          // Approximate geodesic area in km2
          const avgLatRad = ((north + south) / 2) * (Math.PI / 180)
          const heightKm = Math.abs(north - south) * 111.13
          const widthKm = Math.abs(east - west) * 111.13 * Math.cos(avgLatRad)
          const approxAreaKm2 = Math.round(heightKm * widthKm)

          onBboxChange(bbox, approxAreaKm2)
        }

        map.on(createdEvent, handleCreated)
        return () => {
          map.removeControl(drawControl)
          map.removeLayer(drawnItems)
          map.off(createdEvent, handleCreated)
        }
      } catch (err) {
        console.warn('DrawControl setup error:', err)
      }
    }

    const cleanupPromise = initDraw()

    return () => {
      active = false
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [map, onBboxChange])

  return null
}

// ─── BboxRectangle component ──────────────────────────────────────────────────
function BboxRectangle({ bbox }) {
  if (!bbox) return null
  const [minLon, minLat, maxLon, maxLat] = bbox
  const bounds = [[minLat, minLon], [maxLat, maxLon]]

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{ color: '#FF4500', weight: 2, fill: false, dashArray: '6 4' }}
    />
  )
}

// ─── FlyToRegion component (Fires once and cleans up) ─────────────────────────
function FlyToRegion({ target, onComplete }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo(target.center, target.zoom, { duration: 1.2 })
    if (onComplete) {
      onComplete()
    }
  }, [target, map, onComplete])
  return null
}

// ─── FRP Legend ───────────────────────────────────────────────────────────────
function FRPLegend() {
  return (
    <div className="absolute bottom-6 left-3 z-[1000] bg-bg-card/95 backdrop-blur border border-border-muted rounded-lg px-3 py-2.5 text-xs space-y-1.5">
      <p className="label-muted mb-1">FRP (Fire Radiative Power)</p>
      {[
        { color: '#FFD700', label: 'Low  < 10 MW' },
        { color: '#FF8C00', label: 'Med  10–50 MW' },
        { color: '#FF0000', label: 'High > 50 MW' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Free & Open Zero-Key Basemap Providers ──────────────────────────────────
const BASEMAPS = {
  dark: {
    name: 'Dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxZoom: 16,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxZoom: 18,
  },
  osm: {
    name: 'OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '',
    maxZoom: 19,
  },
}

// ─── Map Resize Invalidation Helper ───────────────────────────────────────────
function MapResizeHandler() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    const timer1 = setTimeout(() => map.invalidateSize(), 100)
    const timer2 = setTimeout(() => map.invalidateSize(), 400)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    const container = map.getContainer()
    if (container) resizeObserver.observe(container)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      resizeObserver.disconnect()
    }
  }, [map])
  return null
}

// ─── Main FireMap ─────────────────────────────────────────────────────────────
export default function FireMap({ customHotspots }) {
  const bbox = useAppStore(s => s.bbox)
  const aoiAreaKm2 = useAppStore(s => s.aoiAreaKm2)
  const aoiName = useAppStore(s => s.aoiName)
  const setBboxAndRefetch = useAppStore(s => s.setBboxAndRefetch)
  const customGeoJson = useAppStore(s => s.customGeoJson)
  const setCustomGeoJson = useAppStore(s => s.setCustomGeoJson)
  const storeHotspots = useAppStore(s => s.hotspots)
  const hotspots = customHotspots || storeHotspots
  const [flyTarget, setFlyTarget] = useState(null)
  const [showOutline, setShowOutline] = useState(false)
  const [basemap, setBasemap] = useState('osm')
  const [sensorFilter, setSensorFilter] = useState('all') // 'all' | 'modis' | 'viirs'
  const [activeRadiusKm, setActiveRadiusKm] = useState(50)
  const fileInputRef = useRef(null)

  const handleBboxChange = useCallback((newBbox, areaKm2) => {
    setCustomGeoJson(null)
    setBboxAndRefetch(newBbox, areaKm2, 'Custom Drawn AOI')
  }, [setBboxAndRefetch, setCustomGeoJson])

  const setAOIWithRadius = (lat, lng, radiusKm, label = 'Study AOI') => {
    setActiveRadiusKm(radiusKm)
    setCustomGeoJson(null)
    const avgLatRad = lat * (Math.PI / 180)
    const dLat = radiusKm / 111.13
    const dLon = radiusKm / (111.13 * Math.max(0.15, Math.cos(avgLatRad)))
    const w = parseFloat((lng - dLon).toFixed(4))
    const s = parseFloat((lat - dLat).toFixed(4))
    const e = parseFloat((lng + dLon).toFixed(4))
    const n = parseFloat((lat + dLat).toFixed(4))
    const newBbox = [w, s, e, n]
    const area = calculateBboxAreaKm2(newBbox)
    const displayName = `${label} [${radiusKm} km radius]`
    setBboxAndRefetch(newBbox, area, displayName)

    let zoom = 13
    if (radiusKm >= 1000) zoom = 5
    else if (radiusKm >= 500) zoom = 6
    else if (radiusKm >= 300) zoom = 7
    else if (radiusKm >= 100) zoom = 9
    else if (radiusKm >= 50) zoom = 10
    else if (radiusKm >= 25) zoom = 11
    else zoom = 13

    setFlyTarget({ center: [lat, lng], zoom })
  }

  const changeActiveRadius = (newRadiusKm) => {
    setActiveRadiusKm(newRadiusKm)
    const centerLat = (bbox[1] + bbox[3]) / 2
    const centerLng = (bbox[0] + bbox[2]) / 2
    const cleanLabel = (aoiName || 'AOI').split('[')[0].trim()
    setAOIWithRadius(centerLat, centerLng, newRadiusKm, cleanLabel)
  }

  const handleSelectGlobalLocation = (loc) => {
    setCustomGeoJson(null)
    const center = loc.center || [
      (loc.bbox[1] + loc.bbox[3]) / 2,
      (loc.bbox[0] + loc.bbox[2]) / 2,
    ]
    const radius = loc.preferredRadius || activeRadiusKm || 25
    setAOIWithRadius(center[0], center[1], radius, loc.name)
  }

  const snapToRegion = (key) => {
    setCustomGeoJson(null)
    const preset = REGION_PRESETS[key]
    if (!preset) return
    setBboxAndRefetch(preset.bbox, null, preset.label)
    setFlyTarget({ center: preset.center, zoom: preset.zoom })
  }

  const handleGeoJsonUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        const computedBbox = getGeoJsonBbox(parsed)
        if (computedBbox) {
          const area = calculateBboxAreaKm2(computedBbox)
          const aoiTitle = file.name.replace(/\.[^/.]+$/, '')
          setCustomGeoJson(parsed)
          setBboxAndRefetch(computedBbox, area, aoiTitle, parsed)
          setFlyTarget({
            center: [(computedBbox[1] + computedBbox[3]) / 2, (computedBbox[0] + computedBbox[2]) / 2],
            zoom: 8,
          })
        }
      } catch (err) {
        alert('Invalid GeoJSON format: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  // Filter hotspots by sensor layer and polygon boundary
  const displayedHotspots = (hotspots || []).filter((pt) => {
    if (sensorFilter === 'modis' && !pt.sensor?.toUpperCase().includes('MODIS')) return false
    if (sensorFilter === 'viirs' && !pt.sensor?.toUpperCase().includes('VIIRS')) return false
    if (customGeoJson && !isHotspotInGeoJson(pt.lat, pt.lon, customGeoJson)) return false
    return true
  })

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden border border-border-muted flex flex-col">
      {/* Hidden GeoJSON input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleGeoJsonUpload}
        accept=".geojson,.json"
        className="hidden"
      />

      {/* Top Floating Controls & Global Earth Search Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1010] flex items-center justify-between gap-2.5 pointer-events-none">
        {/* Universal Earth Search (Any city, country, biome) */}
        <div className="pointer-events-auto w-64 sm:w-72 md:w-80 shadow-xl flex-shrink-0">
          <GlobalLocationSearch onSelectLocation={handleSelectGlobalLocation} />
        </div>

        {/* Quick-snap regions, Basemaps & Layer Controls Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full bg-bg-card/95 backdrop-blur-md border border-border-muted rounded-xl p-1 shadow-lg scrollbar-none flex-shrink">
          <div className="hidden lg:flex items-center gap-1">
            {Object.entries(REGION_PRESETS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => snapToRegion(key)}
                className="bg-bg-secondary hover:bg-bg-hover text-text-primary text-[11px] px-2 py-0.5 rounded-lg border border-border-muted hover:border-ember hover:text-ember transition-colors whitespace-nowrap flex-shrink-0 font-medium"
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-bg-secondary hover:bg-bg-hover border border-border-muted text-text-muted hover:text-text-primary text-[11px] px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 hover:border-ember whitespace-nowrap flex-shrink-0 font-medium"
            title="Upload AOI GeoJSON"
          >
            <Upload size={11} className="text-ember" />
            <span className="hidden sm:inline">GeoJSON</span>
          </button>

          {customGeoJson && (
            <button
              onClick={() => setCustomGeoJson(null)}
              className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] px-2 py-0.5 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1 font-mono whitespace-nowrap flex-shrink-0"
              title="Clear Custom Polygon Boundary"
            >
              ✕ Clear Poly
            </button>
          )}

          {/* Multi-Scale Radius Scale (10km to 1000km) */}
          <div className="flex items-center bg-bg-card border border-border-muted rounded-lg p-0.5 text-[11px] font-mono">
            <span className="text-[10px] text-text-muted px-1.5 font-sans font-semibold flex items-center gap-1">
              <Target size={11} className="text-ember" />
              <span className="hidden sm:inline">Range:</span>
            </span>
            {[10, 25, 50, 100, 300, 500, 1000].map(km => (
              <button
                key={km}
                onClick={() => changeActiveRadius(km)}
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap',
                  activeRadiusKm === km
                    ? 'bg-ember text-white shadow'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                )}
                title={`Set study radius to ${km} km`}
              >
                {km >= 1000 ? '1000k' : `${km}k`}
              </button>
            ))}
          </div>

          {/* Sensor Layer Filter Toggle */}
          <div className="flex items-center bg-bg-card border border-border-muted rounded-lg p-0.5 text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'modis', label: 'MODIS' },
              { id: 'viirs', label: 'VIIRS' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSensorFilter(opt.id)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap flex-shrink-0',
                  sensorFilter === opt.id
                    ? 'bg-amber-600 text-white font-semibold shadow'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Basemap Switcher (100% Free / No API Key Required) */}
          <div className="flex items-center bg-bg-card border border-border-muted rounded-lg p-0.5 text-[11px]">
            {Object.entries(BASEMAPS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setBasemap(key)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap flex-shrink-0',
                  basemap === key
                    ? 'bg-ember text-white shadow font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {cfg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart AOI Intelligence Badge (Top Right) */}
      <div className="absolute top-16 right-2.5 z-[990] bg-bg-card/95 backdrop-blur-md border border-border-muted rounded-lg px-2.5 py-1.5 text-xs font-mono space-y-0.5 shadow-lg max-w-[220px] hidden md:block">
        <div className="flex items-center gap-1 text-ember font-bold text-[11px]">
          <Crosshair size={11} className="text-ember" />
          <span>SMART AOI INTEL</span>
        </div>
        <div className="text-text-primary text-[11px] truncate font-semibold" title={aoiName}>{aoiName || 'Active Region'}</div>
        <div className="text-[10px] text-text-muted flex justify-between">
          <span>Range Scale:</span>
          <span className="text-amber-400 font-bold">{activeRadiusKm} km Radius</span>
        </div>
        <div className="text-[10px] text-text-muted flex justify-between">
          <span>Area:</span>
          <span className="text-text-primary">{aoiAreaKm2 ? `${aoiAreaKm2.toLocaleString()} km²` : 'Standard Bbox'}</span>
        </div>
        <div className="text-[10px] text-text-muted flex justify-between">
          <span>Baseline:</span>
          <span className="text-emerald-400 font-bold">27-Yr Harmonized (2000–2026)</span>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[21.2, 72.8]}
        zoom={8}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', minHeight: '600px', flex: 1 }}
        preferCanvas
      >
        <MapResizeHandler />
        {/* Re-positioned Zoom Control away from Search Bar to bottom-right */}
        <ZoomControl position="bottomright" />
        {/* Zero-Key Open Basemap Layer */}
        <TileLayer
          key={basemap}
          url={BASEMAPS[basemap].url}
          attribution={BASEMAPS[basemap].attribution}
          maxZoom={BASEMAPS[basemap].maxZoom}
        />

        {/* Fly to region trigger (flies once and cleans up) */}
        {flyTarget && (
          <FlyToRegion
            target={flyTarget}
            onComplete={() => setFlyTarget(null)}
          />
        )}

        {/* Draw tool */}
        <DrawControl onBboxChange={handleBboxChange} />

        {/* AOI Bbox Rectangle */}
        <BboxRectangle bbox={bbox} />

        {/* Custom Uploaded GeoJSON Polygon Overlay */}
        {customGeoJson && (
          <GeoJSON
            key={JSON.stringify(customGeoJson).slice(0, 50)}
            data={customGeoJson}
            style={{
              color: '#FF4500',
              weight: 2.5,
              fillColor: '#FF4500',
              fillOpacity: 0.2,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* Gujarat outline */}
        {showOutline && (
          <FeatureGroup>
            {/* Simple polygon approximation rendered via Leaflet Polygon */}
            <LeafletPolygon positions={GUJARAT_OUTLINE} />
          </FeatureGroup>
        )}

        {/* Hotspot CircleMarkers */}
        {displayedHotspots.map((pt) => (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lon]}
            radius={frpToRadius(pt.frp)}
            pathOptions={{
              fillColor: frpToColor(pt.frp),
              color: frpToColor(pt.frp),
              fillOpacity: 0.75,
              weight: 0.5,
            }}
          >
            <Popup>
              <div className="text-xs space-y-1.5 p-0.5 min-w-[190px]">
                <div className="font-semibold text-ember flex items-center justify-between border-b border-border-muted pb-1">
                  <span className="flex items-center gap-1"><Flame size={12} className="text-ember" /> Active Fire Hotspot</span>
                  <span className="text-[10px] px-1 py-0.2 bg-ember/20 text-ember rounded font-mono">{pt.sensor}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[11px]">
                  <div><span className="text-text-muted">Date:</span> {pt.date}</div>
                  <div><span className="text-text-muted">Time:</span> {pt.time || '13:30'} UTC</div>
                  <div><span className="text-text-muted">Satellite:</span> {pt.satellite || (pt.sensor === 'MODIS' ? 'Terra/Aqua' : 'SNPP/NOAA')}</div>
                  <div><span className="text-text-muted">FRP:</span> <strong className="text-orange-400">{pt.frp} MW</strong></div>
                  <div><span className="text-text-muted">Confidence:</span> {pt.confidence} ({pt.confidence_norm || 60}%)</div>
                  <div><span className="text-text-muted">Pass:</span> {pt.daynight === 'N' ? 'Night' : 'Day'}</div>
                </div>
                <div className="border-t border-border-muted pt-1 text-[10px] space-y-0.5 text-text-muted font-mono">
                  <div>Coords: {pt.lat?.toFixed(4)}, {pt.lon?.toFixed(4)}</div>
                  <div className="flex items-center gap-1">
                    <span>Status:</span>
                    {pt.is_collocated ? (
                      <span className="text-amber-400 font-semibold">Collocated Overpass Match</span>
                    ) : (
                      <span className="text-emerald-400">Independent Detection</span>
                    )}
                  </div>
                  <div>Product: {pt.source_product || 'NASA_FIRMS'} ({pt.processing_type || 'SP'})</div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* FRP Legend */}
      <FRPLegend />

      {/* Bbox info badge */}
      <div className="absolute bottom-6 right-3 z-[1000] bg-bg-card/95 backdrop-blur border border-border-muted rounded-lg px-3 py-2 text-xs font-mono text-text-muted">
        <div className="flex items-center gap-1 mb-0.5">
          <MapPin size={11} className="text-ember" />
          <span className="text-text-primary font-semibold">AOI Bounds</span>
        </div>
        <div>W: {bbox[0].toFixed(3)}  E: {bbox[2].toFixed(3)}</div>
        <div>S: {bbox[1].toFixed(3)}  N: {bbox[3].toFixed(3)}</div>
      </div>
    </div>
  )
}

// ─── LeafletPolygon helper ────────────────────────────────────────────────────
function LeafletPolygon({ positions }) {
  const map = useMap()
  useEffect(() => {
    const polygon = L.polygon(positions, {
      color: '#FF4500',
      weight: 1.5,
      fill: false,
      dashArray: '4 3',
      opacity: 0.5,
    }).addTo(map)
    return () => map.removeLayer(polygon)
  }, [map, positions])
  return null
}
