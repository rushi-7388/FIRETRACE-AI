import { useEffect, useRef, useCallback, useState } from 'react'
import { MapContainer, TileLayer, useMap, FeatureGroup, CircleMarker, Popup, Rectangle } from 'react-leaflet'
import L from 'leaflet'
import useAppStore from '../../store/useAppStore.js'
import { frpToColor, frpToRadius } from '../../utils/colors.js'
import { formatDate } from '../../utils/format.js'
import { MapPin, Crosshair, Layers } from 'lucide-react'
import clsx from 'clsx'

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
  surat:      { bbox: [72.6, 21.0, 73.2, 21.4], label: 'Surat',      center: [21.17, 72.83], zoom: 10 },
  ahmedabad:  { bbox: [72.4, 22.9, 73.0, 23.3], label: 'Ahmedabad',  center: [23.03, 72.59], zoom: 10 },
  gujarat:    { bbox: [68.1, 20.1, 74.5, 24.7], label: 'Gujarat',    center: [22.26, 71.19], zoom: 7  },
  amazon:     { bbox: [-62, -10, -50, -2],       label: 'Amazon',     center: [-6, -56],      zoom: 5  },
  australia:  { bbox: [135, -38, 155, -25],      label: 'Australia',  center: [-32, 145],     zoom: 5  },
}

// ─── DrawControl component ────────────────────────────────────────────────────
function DrawControl({ onBboxChange }) {
  const map = useMap()
  const drawRef = useRef(null)

  useEffect(() => {
    if (!window.L || !window.L.Control || !window.L.Control.Draw) return

    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      edit:  { featureGroup: drawnItems },
      draw:  {
        rectangle: { shapeOptions: { color: '#FF4500', weight: 2 } },
        polygon:   false,
        circle:    false,
        marker:    false,
        polyline:  false,
        circlemarker: false,
      },
    })
    map.addControl(drawControl)
    drawRef.current = { drawControl, drawnItems }

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      const bounds = e.layer.getBounds()
      const bbox = [
        parseFloat(bounds.getWest().toFixed(4)),
        parseFloat(bounds.getSouth().toFixed(4)),
        parseFloat(bounds.getEast().toFixed(4)),
        parseFloat(bounds.getNorth().toFixed(4)),
      ]
      onBboxChange(bbox)
    })

    return () => {
      map.removeControl(drawControl)
      map.removeLayer(drawnItems)
      map.off(L.Draw.Event.CREATED)
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

// ─── FlyToRegion component ────────────────────────────────────────────────────
function FlyToRegion({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo(target.center, target.zoom, { duration: 1.2 })
  }, [target, map])
  return null
}

// ─── FRP Legend ───────────────────────────────────────────────────────────────
function FRPLegend() {
  return (
    <div className="absolute bottom-6 left-3 z-[1000] bg-bg-card/95 backdrop-blur border border-border-muted rounded-lg px-3 py-2.5 text-xs space-y-1.5">
      <p className="label-muted mb-1">FRP (Fire Radiative Power)</p>
      {[
        { color: '#FFD700', label: 'Low  < 10 MW'  },
        { color: '#FF8C00', label: 'Med  10–50 MW' },
        { color: '#FF0000', label: 'High > 50 MW'  },
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

// ─── Main FireMap ─────────────────────────────────────────────────────────────
export default function FireMap({ customHotspots }) {
  const bbox       = useAppStore(s => s.bbox)
  const setBbox    = useAppStore(s => s.setBbox)
  const storeHotspots = useAppStore(s => s.hotspots)
  const hotspots   = customHotspots || storeHotspots
  const [flyTarget, setFlyTarget] = useState(null)
  const [showOutline, setShowOutline] = useState(true)

  const handleBboxChange = useCallback((newBbox) => {
    setBbox(newBbox)
  }, [setBbox])

  const snapToRegion = (key) => {
    const preset = REGION_PRESETS[key]
    if (!preset) return
    setBbox(preset.bbox)
    setFlyTarget({ center: preset.center, zoom: preset.zoom })
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border-muted">
      {/* Region Quick-snap Bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] flex gap-1.5 flex-wrap justify-center">
        {Object.entries(REGION_PRESETS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => snapToRegion(key)}
            className="bg-bg-card/95 backdrop-blur border border-border-muted text-text-primary text-xs
                       px-2.5 py-1 rounded-full hover:border-ember hover:text-ember transition-colors"
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowOutline(v => !v)}
          className={clsx(
            'backdrop-blur border text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1',
            showOutline
              ? 'bg-ember/20 border-ember text-ember'
              : 'bg-bg-card/95 border-border-muted text-text-muted'
          )}
        >
          <Layers size={11} />
          Gujarat
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[21.2, 72.8]}
        zoom={8}
        style={{ width: '100%', height: '100%' }}
        preferCanvas
      >
        {/* Dark tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        {/* Fly to region trigger */}
        {flyTarget && <FlyToRegion target={flyTarget} />}

        {/* Draw tool */}
        <DrawControl onBboxChange={handleBboxChange} />

        {/* AOI Bbox Rectangle */}
        <BboxRectangle bbox={bbox} />

        {/* Gujarat outline */}
        {showOutline && (
          <FeatureGroup>
            {/* Simple polygon approximation rendered via Leaflet Polygon */}
            <LeafletPolygon positions={GUJARAT_OUTLINE} />
          </FeatureGroup>
        )}

        {/* Hotspot CircleMarkers */}
        {hotspots && hotspots.map((pt) => (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lon]}
            radius={frpToRadius(pt.frp)}
            pathOptions={{
              fillColor:   frpToColor(pt.frp),
              color:       frpToColor(pt.frp),
              fillOpacity: 0.75,
              weight:      0.5,
            }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-ember mb-1">🔥 Fire Hotspot</div>
                <div><span className="text-text-muted">Date:</span> {pt.date}</div>
                <div><span className="text-text-muted">FRP:</span> {pt.frp} MW</div>
                <div><span className="text-text-muted">Sensor:</span> {pt.sensor}</div>
                <div><span className="text-text-muted">Confidence:</span> {pt.confidence}</div>
                <div><span className="text-text-muted">Lat/Lon:</span> {pt.lat}, {pt.lon}</div>
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
import { useEffect as ue } from 'react'
function LeafletPolygon({ positions }) {
  const map = useMap()
  ue(() => {
    const polygon = L.polygon(positions, {
      color:     '#FF4500',
      weight:    1.5,
      fill:      false,
      dashArray: '4 3',
      opacity:   0.5,
    }).addTo(map)
    return () => map.removeLayer(polygon)
  }, [map, positions])
  return null
}
