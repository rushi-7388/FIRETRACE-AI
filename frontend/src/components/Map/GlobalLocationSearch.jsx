import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, Globe, MapPin, Compass, Flame, X, ChevronDown, Check,
  Sparkles, Layers, ExternalLink
} from 'lucide-react'
import clsx from 'clsx'

// ─── Extensive Offline Global Fire Biomes & Capital Cities Database ──────────
export const GLOBAL_LOCATIONS_CATALOG = [
  // ── Asia & India ──
  {
    name: 'Surat & South Gujarat',
    country: 'India',
    region: 'Asia',
    category: 'Agricultural & Deciduous',
    bbox: [72.0, 20.0, 74.5, 22.0],
    center: [21.17, 72.83],
    zoom: 9,
    description: 'Primary demonstration study zone: Sugarcane clearing & dry deciduous forest belt.'
  },
  {
    name: 'Punjab & Haryana Crop Belt',
    country: 'India',
    region: 'Asia',
    category: 'Post-Harvest Stubble Burning',
    bbox: [74.0, 29.5, 77.2, 32.2],
    center: [30.85, 75.60],
    zoom: 8,
    description: 'Intense agricultural crop residue fires (paddy stubble) peaking in October-November.'
  },
  {
    name: 'Simlipal & Odisha Forests',
    country: 'India',
    region: 'Asia',
    category: 'Tropical Dry Deciduous',
    bbox: [85.5, 21.0, 87.0, 22.5],
    center: [21.75, 86.25],
    zoom: 9,
    description: 'Central Indian biodiversity reserve prone to March-April leaf litter wildfires.'
  },
  {
    name: 'Uttarakhand Pine Forests',
    country: 'India',
    region: 'Asia',
    category: 'Himalayan Subtropical Conifer',
    bbox: [78.5, 29.5, 80.5, 31.0],
    center: [30.25, 79.50],
    zoom: 8,
    description: 'Himalayan chir pine resinous needle fire season during pre-monsoon heat.'
  },
  {
    name: 'Sumatra & Riau Peatlands',
    country: 'Indonesia',
    region: 'Asia',
    category: 'Tropical Peat Swamp',
    bbox: [100.0, -1.0, 103.5, 2.0],
    center: [0.5, 101.8],
    zoom: 8,
    description: 'Smoldering deep peatland and palm oil deforestation burning causing regional haze.'
  },
  {
    name: 'Kalimantan (Borneo)',
    country: 'Indonesia',
    region: 'Asia',
    category: 'Equatorial Peat & Rainforest',
    bbox: [111.0, -3.5, 116.0, 0.5],
    center: [-1.5, 113.5],
    zoom: 7,
    description: 'El Niño-driven equatorial peat dome fires with extreme particulate emission.'
  },
  {
    name: 'Chiang Mai & Northern Highlands',
    country: 'Thailand',
    region: 'Asia',
    category: 'Indochina Seasonal Burning',
    bbox: [98.0, 18.0, 100.5, 20.0],
    center: [19.0, 99.2],
    zoom: 8,
    description: 'Highland seasonal agricultural slash-and-burn and dipterocarp forest fires.'
  },

  // ── North America ──
  {
    name: 'California Sierra Nevada',
    country: 'United States',
    region: 'North America',
    category: 'Chaparral & Mixed Conifer',
    bbox: [-121.5, 36.5, -118.0, 40.5],
    center: [38.5, -119.8],
    zoom: 7,
    description: 'Classic Mediterranean fire regime with Santa Ana and Diablo wind-driven megafires.'
  },
  {
    name: 'Pacific Northwest & Oregon Cascades',
    country: 'United States',
    region: 'North America',
    category: 'Temperate Rain & Conifer Forest',
    bbox: [-124.0, 42.0, -119.5, 46.0],
    center: [44.0, -121.7],
    zoom: 7,
    description: 'Dense Douglas fir and ponderosa pine timber fires under summer drought conditions.'
  },
  {
    name: 'Alberta Boreal Forest',
    country: 'Canada',
    region: 'North America',
    category: 'Boreal Crown Fire',
    bbox: [-119.0, 53.5, -111.0, 58.5],
    center: [56.0, -115.0],
    zoom: 6,
    description: 'High-intensity crown fires in black spruce and jack pine, Fort McMurray corridor.'
  },
  {
    name: 'Northwest Territories & Great Slave',
    country: 'Canada',
    region: 'North America',
    category: 'Sub-Arctic Taiga',
    bbox: [-122.0, 60.0, -112.0, 64.5],
    center: [62.2, -117.0],
    zoom: 6,
    description: 'Vast lightning-ignited wilderness fires in discontinuous permafrost taiga.'
  },
  {
    name: 'Texas Panhandle & Plains',
    country: 'United States',
    region: 'North America',
    category: 'Grassland & Shrubland',
    bbox: [-103.0, 34.0, -99.0, 37.0],
    center: [35.5, -101.0],
    zoom: 7,
    description: 'Fast-moving winter and early spring prairie grass fires driven by dry Chinook winds.'
  },

  // ── South America ──
  {
    name: 'Amazon Deforestation Arc (Mato Grosso)',
    country: 'Brazil',
    region: 'South America',
    category: 'Tropical Rainforest Clearing',
    bbox: [-60.0, -14.0, -52.0, -8.0],
    center: [-11.0, -56.0],
    zoom: 6,
    description: 'Heavy conversion of primary Amazonian evergreen forest to pasture and soybean.'
  },
  {
    name: 'Pantanal Tropical Wetlands',
    country: 'Brazil / Bolivia',
    region: 'South America',
    category: 'Flooded Grasslands & Savanna',
    bbox: [-58.5, -20.5, -55.0, -16.0],
    center: [-18.0, -56.8],
    zoom: 7,
    description: 'World’s largest tropical wetland ecosystem experiencing severe drought burning.'
  },
  {
    name: 'Gran Chaco Dry Forests',
    country: 'Argentina / Paraguay',
    region: 'South America',
    category: 'Subtropical Dry Forest',
    bbox: [-63.5, -27.5, -59.0, -22.0],
    center: [-24.8, -61.2],
    zoom: 7,
    description: 'Deforestation front in South America’s second largest forest ecosystem.'
  },
  {
    name: 'Valparaíso & Central Chile',
    country: 'Chile',
    region: 'South America',
    category: 'Mediterranean Coastal WUI',
    bbox: [-72.0, -34.5, -70.0, -32.5],
    center: [-33.5, -71.0],
    zoom: 8,
    description: 'Extreme wildland-urban interface (WUI) fires in eucalyptus and pine plantations.'
  },

  // ── Europe & Mediterranean ──
  {
    name: 'Attica & Peloponnese',
    country: 'Greece',
    region: 'Europe',
    category: 'Mediterranean Scrub & Pine',
    bbox: [21.0, 36.5, 24.5, 39.0],
    center: [37.8, 22.8],
    zoom: 8,
    description: 'Frequent heatwave and Meltemi wind-driven fires in Aleppo pine and phrygana.'
  },
  {
    name: 'Iberian Peninsula (Galicia & North Portugal)',
    country: 'Portugal / Spain',
    region: 'Europe',
    category: 'Atlantic-Mediterranean Pine',
    bbox: [-9.0, 39.5, -6.5, 43.0],
    center: [41.2, -7.8],
    zoom: 8,
    description: 'High wildfire density in maritime pine and blue gum eucalyptus woodlands.'
  },
  {
    name: 'Sicily & Southern Apennines',
    country: 'Italy',
    region: 'Europe',
    category: 'Mediterranean Maquis',
    bbox: [12.0, 36.5, 16.0, 39.0],
    center: [37.5, 14.0],
    zoom: 8,
    description: 'Sirocco wind-exacerbated summer wildfires in coastal garrigue and olive groves.'
  },
  {
    name: 'Landes de Gascogne',
    country: 'France',
    region: 'Europe',
    category: 'Cultivated Pine Forest',
    bbox: [-1.5, 44.0, -0.2, 45.0],
    center: [44.5, -0.8],
    zoom: 9,
    description: 'Western Europe’s largest maritime pine plantation forest subject to summer heatwaves.'
  },

  // ── Africa & Oceania ──
  {
    name: 'New South Wales (Blue Mountains)',
    country: 'Australia',
    region: 'Oceania',
    category: 'Temperate Sclerophyll (Eucalyptus)',
    bbox: [148.0, -36.5, 153.5, -31.0],
    center: [-33.8, 150.5],
    zoom: 7,
    description: 'Epicenter of Australia’s Black Summer bushfires producing pyrocumulonimbus storms.'
  },
  {
    name: 'Northern Territory & Kimberley',
    country: 'Australia',
    region: 'Oceania',
    category: 'Tropical Savanna Woodland',
    bbox: [129.0, -18.0, 137.0, -11.5],
    center: [-14.5, 133.0],
    zoom: 6,
    description: 'Annual dry-season savanna burning managed by indigenous fire stewardship.'
  },
  {
    name: 'Congo Basin Savannas (Katanga)',
    country: 'DR Congo / Angola',
    region: 'Africa',
    category: 'Miombo Woodland & Savanna',
    bbox: [20.0, -12.0, 29.0, -6.0],
    center: [-9.0, 24.5],
    zoom: 6,
    description: 'Earth’s largest continuous active burning belt by satellite fire count (June-August).'
  },
  {
    name: 'Western Cape Fynbos',
    country: 'South Africa',
    region: 'Africa',
    category: 'Mediterranean Shrubland',
    bbox: [18.0, -35.0, 21.0, -33.0],
    center: [-34.0, 19.5],
    zoom: 8,
    description: 'Fire-adapted fynbos biome with summer Bergwind-driven mountain fires.'
  },
  {
    name: 'Siberian Taiga (Sakha Republic)',
    country: 'Russia',
    region: 'Asia',
    category: 'Boreal Larch & Peat Taiga',
    bbox: [115.0, 60.0, 135.0, 67.0],
    center: [63.5, 125.0],
    zoom: 5,
    description: 'Extreme arctic and sub-arctic Siberian peat fires releasing vast carbon stores.'
  },
]

// ─── Component: Global Location Search & Biome Selector ──────────────────────
export default function GlobalLocationSearch({ onSelectLocation }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeRegion, setActiveRegion] = useState('All')
  const [onlineResults, setOnlineResults] = useState([])
  const [isSearchingOnline, setIsSearchingOnline] = useState(false)
  const searchTimeoutRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter local offline catalog
  const filteredLocal = useMemo(() => {
    let list = GLOBAL_LOCATIONS_CATALOG
    if (activeRegion !== 'All') {
      list = list.filter(l => l.region === activeRegion)
    }
    if (query.trim().length > 0) {
      const q = query.toLowerCase()
      list = list.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.region.toLowerCase().includes(q)
      )
    }
    return list
  }, [query, activeRegion])

  // Live OpenStreetMap Nominatim Geocoding for ANY location on Earth
  useEffect(() => {
    if (query.trim().length < 3) {
      setOnlineResults([])
      setIsSearchingOnline(false)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingOnline(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const mapped = data.map(item => {
            const minLat = parseFloat(item.boundingbox[0])
            const maxLat = parseFloat(item.boundingbox[1])
            const minLon = parseFloat(item.boundingbox[2])
            const maxLon = parseFloat(item.boundingbox[3])
            return {
              name: item.display_name.split(',')[0],
              country: item.display_name.split(',').slice(-1)[0]?.trim() || '',
              region: 'Global Search',
              category: item.type ? item.type.toUpperCase() : 'PLACE',
              bbox: [minLon, minLat, maxLon, maxLat],
              center: [parseFloat(item.lat), parseFloat(item.lon)],
              zoom: 9,
              description: item.display_name,
              isOnline: true,
            }
          })
          setOnlineResults(mapped)
        }
      } catch (err) {
        console.debug('Nominatim offline or rate-limited; fallback to local catalog:', err)
      } finally {
        setIsSearchingOnline(false)
      }
    }, 450)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (loc) => {
    onSelectLocation(loc)
    setIsOpen(false)
    setQuery(loc.name)
  }

  const regions = ['All', 'Asia', 'North America', 'South America', 'Europe', 'Oceania', 'Africa']

  return (
    <div className="relative w-full max-w-xl" ref={dropdownRef}>
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-ember pointer-events-none flex items-center">
          <Globe size={16} className="animate-pulse" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          placeholder="Search any place on Earth (e.g. California, Amazon, Greece, Punjab, Siberia)..."
          className="w-full bg-bg-card/95 backdrop-blur-md border border-border-muted hover:border-ember/50 focus:border-ember
                     text-text-primary text-xs pl-9 pr-8 py-2 rounded-xl shadow-lg focus:outline-none transition-all font-sans"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOnlineResults([])
            }}
            className="absolute right-2.5 text-text-muted hover:text-text-primary p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card/98 backdrop-blur-xl border border-border-muted rounded-xl shadow-2xl z-[1200] overflow-hidden animate-fade-in flex flex-col max-h-[460px]">
          {/* Header & Region Tabs */}
          <div className="p-2 border-b border-border-muted bg-bg-secondary/60">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={13} className="text-ember" />
                Global Fire Biomes & Locations
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                {filteredLocal.length + onlineResults.length} locations available
              </span>
            </div>

            {/* Region Filter Chips */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setActiveRegion(reg)}
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors',
                    activeRegion === reg
                      ? 'bg-ember text-white font-semibold'
                      : 'bg-bg-card text-text-muted hover:text-text-primary border border-border-muted'
                  )}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Locations List */}
          <div className="overflow-y-auto divide-y divide-border-muted/50 flex-1">
            {/* Live Online Nominatim Results if available */}
            {onlineResults.length > 0 && (
              <div className="p-1.5 bg-sky-500/5">
                <div className="text-[10px] font-bold text-sky-400 px-2 py-1 flex items-center gap-1">
                  <Sparkles size={11} />
                  Live Earth Search Results (OpenStreetMap)
                </div>
                {onlineResults.map((item, idx) => (
                  <button
                    key={`online-${idx}`}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-hover flex items-start justify-between gap-2 transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-sky-400 flex items-center gap-1.5">
                        <MapPin size={13} className="text-sky-400 flex-shrink-0" />
                        {item.name}
                        <span className="text-[10px] text-text-muted font-normal">({item.country})</span>
                      </div>
                      <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5 font-sans">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 flex-shrink-0">
                      Live Geo
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isSearchingOnline && (
              <div className="p-2 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-ember border-t-transparent rounded-full animate-spin" />
                Searching entire planet Earth...
              </div>
            )}

            {/* Offline Catalog Results */}
            {filteredLocal.map((loc, idx) => (
              <button
                key={`local-${idx}`}
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-3 py-2.5 hover:bg-bg-hover flex items-start justify-between gap-3 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary group-hover:text-ember flex items-center gap-1.5">
                    <Flame size={13} className="text-ember flex-shrink-0" />
                    <span className="truncate">{loc.name}</span>
                    <span className="text-[10px] text-text-muted font-normal flex-shrink-0">
                      • {loc.country}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1 font-sans">
                    {loc.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block text-[9px] font-mono bg-bg-secondary text-text-muted px-1.5 py-0.5 rounded border border-border-muted group-hover:border-ember/40">
                    {loc.category}
                  </span>
                </div>
              </button>
            ))}

            {filteredLocal.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
              <div className="p-6 text-center text-xs text-text-muted">
                No matching locations found. Press enter or search any city/country on Earth.
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="p-2 bg-bg-secondary/70 border-t border-border-muted text-[10px] text-text-muted flex items-center justify-between font-mono">
            <span>NASA Space Apps 2026 • Global Coverage</span>
            <span className="text-ember">Type any place to auto-geolocate</span>
          </div>
        </div>
      )}
    </div>
  )
}

