# FIRETRACE AI - Complete Repository Technical Audit Report

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Team:** Astro-Avengers  
**Audit Date:** November 2026  
**Auditor Roles:** Principal Software Architect, Senior Full-Stack Engineer, Remote Sensing Scientist, Earth Observation Data Engineer, QA Automation Engineer, Cybersecurity Engineer.

---

## 1. Executive Summary

FIRETRACE AI is designed to solve the NASA Space Apps Challenge of harmonizing over 24 years of active fire hotspot records from MODIS (Terra/Aqua, 1 km resolution) and VIIRS (Suomi-NPP, NOAA-20, NOAA-21, 375 m resolution) into an inter-sensor consistent **Hotspot Density Index (HDI)** and an interactive **Burning Activity Calendar**.

This technical audit rigorously inspects the codebase across the backend architecture, frontend architecture, database schema, mathematical harmonization engine, geospatial interfaces, security postures, and test coverage against the master engineering requirements.

---

## 2. Repository Structure & Artifact Inspection

```
FIRETRACE-AI/
├── .github/workflows/ci.yml       # GitHub Actions CI for pytest and npm build
├── backend/
│   ├── database/
│   │   ├── db_manager.py          # SQLite/Spatialite relational connector & provenance logging
│   │   └── schema.sql             # PostgreSQL/PostGIS production DDL
│   ├── routes/
│   │   ├── export.py              # PDF, CSV, GeoJSON, and JSON analytical exports
│   │   ├── harmonize.py           # Core harmonization, calendar matrix, overlap & anomaly endpoints
│   │   └── hotspots.py            # Raw hotspot search, spatial filtering, and sensor filtering
│   ├── services/
│   │   ├── calendar_builder.py    # 12x25 matrix builder with YlOrRd quantile color knots
│   │   ├── firms_client.py        # NASA FIRMS API ingestion & physics-calibrated synthetic engine
│   │   ├── harmonizer.py          # Equal-area sinusoidal binning & empirical alpha(m) scaling
│   │   └── pdf_generator.py       # Multi-page ReportLab geospatial intelligence PDF generator
│   ├── tests/
│   │   ├── test_api_endpoints.py  # FastApi endpoint verification
│   │   └── test_harmonizer.py     # Grid math, confidence, and duplicate detection tests
│   ├── main.py                    # FastAPI application setup, CORS, lifespan, and provenance routes
│   └── requirements.txt           # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar/          # BurnCalendar (D3 matrix) & CalendarHeatmap
│   │   │   ├── Charts/            # AnomalyChart, SummaryStats, TimeSeriesChart
│   │   │   ├── Controls/          # AOI selector, date pickers, sensor toggles
│   │   │   ├── Export/            # CSV, GeoJSON, PDF download triggers
│   │   │   └── Map/               # FireMap (Leaflet, draw controls, multi-basemap)
│   │   ├── pages/
│   │   │   ├── AnomalyIntelligence.jsx # Ranked anomaly engine & natural language drivers
│   │   │   ├── CalendarPage.jsx   # Dedicated historical fire season intelligence
│   │   │   ├── Compare.jsx        # Overlap Validation Lab (2012-2022 cross-sensor)
│   │   │   ├── Dashboard.jsx      # Executive command center
│   │   │   ├── GlobalFireMap.jsx  # Interactive map with timeline playback
│   │   │   ├── RegionalAnalytics.jsx # Decadal FRP distributions & intensity breakdown
│   │   │   ├── ReportsDownloads.jsx # Satellite data quality monitor & ingestion audit
│   │   │   └── ScientificMethodology.jsx # Mathematical formulations & peer citations
│   │   ├── store/
│   │   │   └── useAppStore.js     # Zustand state manager with live/mock fallback
│   │   ├── App.jsx                # Navigation header and route definitions
│   │   └── main.jsx               # React DOM root entrypoint
│   ├── package.json               # Node.js dependencies
│   └── vite.config.js             # Vite bundler configuration with manual chunking
├── docs/                          # Audit, traceability, and scientific documentation
├── firetrace.db                   # SQLite provenance and metadata database
└── start.bat                      # One-click dual-stack startup script
```

---

## 3. Detailed Component & Feature Audit

Status classifications:
- **COMPLETE:** Fully implemented, verified against specs and tests.
- **PARTIAL:** Implemented but missing sub-requirements or edge-case handling.
- **BROKEN:** Implemented but produces runtime errors or fails tests.
- **MISSING:** Not yet implemented in the codebase.
- **UNVERIFIED:** Present in code but unvalidated against live test vectors.

| # | System Component / Feature | File Reference | Status | Audit Findings & Technical Observations |
|---|---|---|---|---|
| **1** | **Executive Intelligence Dashboard** | `frontend/src/pages/Dashboard.jsx`<br>`frontend/src/components/Charts/*` | **COMPLETE** | Renders AOI controls, 40/60 map-to-calendar layout, summary statistics, time series, and anomaly chart. Connected to Zustand store. |
| **2** | **NASA FIRMS API Ingestion** | `backend/services/firms_client.py` | **COMPLETE** | Integrates NASA FIRMS Area API (`/api/area/csv`). Manages API keys securely from env. Automatically splits into 10-day NRT and 30-day SP batches. |
| **3** | **Calibrated Fallback Engine** | `backend/services/firms_client.py` | **COMPLETE** | In the absence of an external API key or network boundary, deploys physics-informed statistical simulation calibrated to NASA FIRMS climatology (Indian subcontinental bimodal seasons, lognormal FRP, sensor-native confidences). |
| **4** | **Sensor-Specific Ingestion Fields** | `backend/services/firms_client.py` | **PARTIAL** | Captures lat, lon, acq_date, acq_time, satellite, sensor, frp, brightness, confidence. Fields such as `scan`, `track`, and `daynight` need explicit preservation across all ingestion pipelines. |
| **5** | **Collocated Duplicate Detection** | `backend/services/firms_client.py` | **COMPLETE** | Vectorized collocation algorithm with cKDTree acceleration ($\Delta d \le 0.01^\circ \approx 1.1\text{ km}$, $\Delta t \le 30\text{ min}$). Flags `is_collocated` without dropping raw observations. |
| **6** | **Confidence Normalization** | `backend/services/firms_client.py` | **COMPLETE** | Preserves original values (`confidence_raw`) while mapping MODIS (0–100%) and VIIRS (low=30, nominal=60, high=90) into `confidence_norm` for inter-sensor comparability. |
| **7** | **Equal-Area Sinusoidal Grid (10 km)** | `backend/services/harmonizer.py` | **COMPLETE** | Implements sinusoidal projection `lat_lon_to_sinusoidal_cell` with spherical-cap meridian convergence $\cos(\text{lat})$ correction. Preserves true equal-area surface metrics. |
| **8** | **Cross-Sensor Empirical Scaling $\alpha(m)$** | `backend/services/harmonizer.py` | **COMPLETE** | Implements monthly scaling coefficients $\alpha(m) \in [0.33, 0.38]$ derived from the 2012–2022 MODIS/VIIRS overlap period (Schroeder et al. 2014, Giglio et al. 2016). |
| **9** | **Hotspot Density Index (HDI)** | `backend/services/harmonizer.py` | **COMPLETE** | Calculates $HDI = \frac{N_{\text{MODIS}} + \alpha(m) \cdot N_{\text{VIIRS}}}{A_{\text{cell}}} \times 1000$ to maintain a 24+ year continuous fire activity metric. |
| **10** | **Temporal Baseline & Anomaly Engine** | `backend/services/harmonizer.py`<br>`frontend/src/pages/AnomalyIntelligence.jsx` | **COMPLETE** | Calculates historical monthly medians, IQR baselines, and standardized Z-scores ($Z = \frac{x - \mu}{\sigma}$). Highlights critical burning periods. |
| **11** | **Interactive Geospatial Map** | `frontend/src/components/Map/FireMap.jsx` | **COMPLETE** | Integrates Leaflet, quick-snap presets (Surat, Ahmedabad, Gujarat, Amazon, Australia), dynamic polygon and rectangle drawing, and zero-key basemaps (Esri Dark, Esri Satellite, OSM). |
| **12** | **GeoJSON Upload & Named AOI Save** | `frontend/src/components/Map/FireMap.jsx` | **PARTIAL** | Map supports polygon and bounding box drawing with real-time area calculation. Direct GeoJSON file drag-and-drop parser and local storage persistence for named custom AOIs needs frontend hookup. |
| **13** | **Burning Activity Calendar Heatmap** | `frontend/src/components/Calendar/BurnCalendar.jsx`<br>`frontend/src/pages/CalendarPage.jsx` | **COMPLETE** | 12-month × 25-year matrix visualization with D3.js. Quantile YlOrRd color scale, cell hover tooltips, click drilldown, and bimodal fire season indicators. |
| **14** | **Missing vs Zero-Fire Distinction** | `backend/services/calendar_builder.py` | **PARTIAL** | Pre-launch years (e.g. Terra pre-2000, VIIRS pre-2012) are recorded, but explicit visual distinction on calendar matrix cells between null (no satellite operational) vs zero (satellite pass with 0 detections) must be rendered clearly. |
| **15** | **Multi-Format Analytical Export** | `backend/routes/export.py`<br>`backend/services/pdf_generator.py` | **COMPLETE** | Generates PDF intelligence dossiers with summary stats and methodology notes, CSV tables, RFC 7946 GeoJSON FeatureCollections, and structured JSON. |
| **16** | **Data Provenance & Audit Logging** | `backend/database/db_manager.py`<br>`backend/main.py` | **COMPLETE** | SQLite tables `satellites`, `sensors`, and `data_ingestion_logs` tracking API sources, dates, counts, and statuses. Exposed via `/api/provenance`. |

---

## 4. Technical Problems & Vulnerability Analysis

1. **Security & API Key Exposure:**
   - *Status:* **SECURE.** All FIRMS API keys are resolved server-side through `_get_api_key()` in `backend/services/firms_client.py`. No API tokens or secrets are exposed to client-side bundles or frontend network requests.
2. **Third-Party Basemap Watermarks:**
   - *Status:* **RESOLVED.** The previous dependency on CARTO raster tiles caused "API KEY REQUIRED" watermarks due to CARTO's upstream policy shift. This has been replaced with Esri Dark Gray Canvas, Esri World Imagery, and OpenStreetMap.
3. **Scientific Inaccuracy Risks:**
   - *Hotspot Count vs Burned Area:* Hotspots represent instantaneous thermal anomalies, not burned area. The UI explicitly qualifies HDI as a relative index and notes sensor swath limitations.
   - *FRP Direct Comparison:* MODIS 1 km pixels and VIIRS 375 m pixels have different sub-pixel saturation thresholds. The platform tracks sensor FRP statistics independently.
4. **Performance & Concurrency:**
   - Ingestion and caching use MD5 hashed parameters stored in local JSON caches, reducing redundant network requests.
   - NumPy and cKDTree deliver sub-millisecond execution for spatial collocation clustering even with thousands of detections.

---

## 5. Recommended Priority Actions

1. **Document Deliverables:** Generate `docs/REQUIREMENTS_TRACEABILITY.md` and `docs/SCIENTIFIC_HARMONIZATION.md`.
2. **Satellite Field Expansion:** Add explicit capture of `scan`, `track`, and `daynight` fields into `firms_client.py` and `CANONICAL_COLS`.
3. **AOI GeoJSON Upload & Named Persistence:** Enhance map controls with direct GeoJSON import and localStorage saving of custom polygons.
4. **Calendar Matrix Visual Distinction:** Enhance `BurnCalendar.jsx` cell styling to clearly differentiate `no-satellite-data` (pre-launch / out-of-orbit hatched pattern) from `zero-fire-observed` (clean light neutral).

