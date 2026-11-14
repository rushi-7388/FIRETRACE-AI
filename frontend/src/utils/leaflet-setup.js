import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

// Ensure L is globally bound on window and globalThis before any legacy plugins load
if (typeof window !== 'undefined') {
  window.L = L
  globalThis.L = L
}

export default L

