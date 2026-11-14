# 🔥 FIRETRACE AI - Satellite Wildfire Intelligence & Harmonized Burning Activity Calendar
### 🚀 NASA Space Apps Challenge 2026 · Surat Region Entry
**Challenge Track:** Earth Science & Remote Sensing Software  
**Problem Statement:** *Harmonization of MODIS and VIIRS Hot Spots*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Pytest](https://img.shields.io/badge/Testing-Pytest_Passed-449C44?logo=pytest&logoColor=white)](https://pytest.org)
[![NASA FIRMS](https://img.shields.io/badge/NASA_Data-FIRMS_EOSDIS-0B3D91?logo=nasa&logoColor=white)](https://firms.modaps.eosdis.nasa.gov)

> **Core Objective:** Scientifically harmonize more than two and a half decades of satellite active fire observation records (MODIS Collection 6.1 on Terra/Aqua and VIIRS 375m on Suomi-NPP, NOAA-20, and NOAA-21) into an unbroken 27-year **Burning Activity Calendar (2000–2026)** and fire intelligence dashboard with 24/7 Zero-API mission resilience and military-grade OWASP security shields.

---

## 🧭 Why Direct Merging Fails: The Scientific Problem

When NASA's VIIRS (375 m pixel) became operational alongside MODIS (1000 m pixel), raw active fire detections spiked by **~3.7× for the identical burning conditions**. This is caused by:
1. **Finer Spatial Resolution:** VIIRS detects smaller, low-intensity agricultural clearing and smoldering fires beneath canopy thresholds that MODIS cannot resolve.
2. **Differing Overpass Geometries:** Observation schedules (Terra morning/evening vs. Aqua & S-NPP afternoon at ~13:30 local) introduce diurnality variations.
3. **Incompatible Confidence Standards:** MODIS utilizes a continuous Bayesian probability ($0\text{--}100\%$), while VIIRS assigns categorical detection flags (`Low`, `Nominal`, `High`).
4. **NASA 2026 Space Operations Transition:** As Suomi-NPP ceases operations in November 2026, FIRETRACE AI seamlessly ingests next-gen NOAA-20 and NOAA-21 VIIRS feeds without monitoring interruption.

**Directly combining raw hotspot records creates severe artificial spikes, misleading emergency managers into believing fire frequency escalated dramatically.**

---

## 🔬 The Solution: Sensor-Aware Harmonization Engine

```
[ NASA RAW OBSERVATIONS (2000–2026) ]
  ├── MODIS (Terra & Aqua, 1 km, 2000–present)
  ├── VIIRS (Suomi-NPP, 375 m, 2012–2026 retired)
  └── VIIRS Next-Gen (NOAA-20 & NOAA-21, 375 m, 2018–present)
            │
            ▼
[ SPATIAL & TEMPORAL DISCRETIZATION ]
  ├── 10 km Equal-Area Sinusoidal Grid (EASE-Grid / MODIS Sinusoidal projection)
  └── Daily Temporal Bins (YYYY-MM-DD)
            │
            ▼
[ SENSOR-AWARE CALIBRATION & PROVENANCE PRESERVATION ]
  ├── Collocation Deduplication (Δd ≤ 1 km, Δt ≤ 30 min)
  ├── 10-Year Mission Overlap Calibration (2012–2022) with Monthly α(m) Factors
  └── Hotspot Density Index (HDI) Computation:
        HDI(cell, t) = [ ( N_MODIS + α(m) · N_VIIRS ) / Area_cell ] × 1000
            │
            ▼
[ STATISTICAL ANOMALY & EARLY WARNING ENGINE ]
  ├── 27-Year Climatological Median Baseline (January – December)
  └── Standardized Z-Score Anomaly Derivation:
        Z = ( HDI - Median_m ) / IQR_m, flagged when |Z| ≥ 1.5σ
            │
            ▼
[ MILITARY-GRADE RESILIENCE & SECURITY SUITE ]
  ├── Dual-Engine: Live NASA Stream + Autonomous 24/7 Zero-API Global Climatology
  ├── Automatic Circuit Breaker (Auto-fallback in <50ms during network outages)
  └── OWASP Top-10 Headers, Anti-DDoS Rate Limiter & SQLi/XSS Guard
```

---

## 🖥️ 9 Complete Application Environments

| # | Page | Route | Description |
|---|---|---|---|
| **01** | **Executive Dashboard** | `/` | Command center with 40/60 map-to-calendar layout, 4 core metrics, NASA Mission Briefing, and summary charts. |
| **02** | **Smart AOI Map** | `/map` | Interactive GIS map with multi-satellite filters (**Terra, Aqua, S-NPP, NOAA-20, NOAA-21**), AOI drawing, timeline playback, and FRP intensity markers. |
| **03** | **Season Calendar** | `/calendar` | **12-Month × 27-Year Historical Burning Activity Calendar (2000–2026)** with missing vs zero fire distinction and daily drilldown. |
| **04** | **Overlap Lab** | `/compare` | Side-by-side sensor bias visualizer with 2012–2022 overlap ratio analysis and empirical scaling coefficients. |
| **05** | **Regional & FRP** | `/analytics` | **Surat & Regional deep-dive**: Decadal activity (2000s vs 2010s vs 2020s), sensor-stratified FRP distributions, and diurnal day/night dynamics. |
| **06** | **Anomaly Engine** | `/anomalies` | **Explainable Anomaly Engine**: Top ranked historical fire anomalies with severity classes, baseline selectors (2000–2026), driver explanations, and official non-dispatch warnings. |
| **07** | **AI Studio** | `/ai-intel` | **Advanced AI/ML**: Haversine DBSCAN fire clustering, Mann-Kendall regime change test, experimental forecasting, Global Burning Fingerprint, and deterministic NL assistant. |
| **08** | **Reports & Quality** | `/reports` | Multi-format exports (**CSV**, **Spatial GeoJSON**, **Structured JSON**, and **PDF Executive Report**) with complete data provenance citations. |
| **09** | **Scientific Methodology** | `/methodology` | Mathematical equations, 10 km sinusoidal equal-area grid formulation, 2012–2022 calibration table, 2026 NOAA-20/21 transition, and peer-reviewed citations. |

---

## 🏛️ Database Architecture (PostgreSQL + PostGIS)

The backend includes a production spatial relational schema ready for disaster management command centers in [`backend/database/schema.sql`](backend/database/schema.sql):

- `satellites` & `sensors`: Multi-satellite orbital specifications and sensor resolutions.
- `fire_observations`: Immutable raw observation table with spatial `GEOMETRY(Point, 4326)` indexes.
- `harmonized_cells`: 10 km sinusoidal polygons with `GEOMETRY(Polygon, 4326)`, counts, HDI, and FRP.
- `data_ingestion_logs`: Provenance tracking for API fetches, date batches, and status.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 20+

### Option A: Local Run

```powershell
# 1. Start Backend (FastAPI)
cd backend
pip install -r requirements.txt
python main.py
# API running at http://localhost:8000 (Swagger docs at /docs)

# 2. Start Frontend (React + Vite)
cd ../frontend
npm install
npm run dev
# Web app running at http://localhost:5173
```

### Option B: Docker Compose (One-Click)

```bash
docker-compose up --build
# Open http://localhost in your browser
```

### Option C: Cloud Deployment (Vercel)

1. Push this repository to your GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. The project is pre-configured with root and frontend [`vercel.json`](vercel.json):
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or select `frontend`)
   - **Build Command**: Automatically managed (`npm run build`)
   - **Output Directory**: `frontend/dist`
   - *(Optional)* **Environment Variables**: `VITE_API_BASE_URL` = `<your-backend-url>`. If omitted, FIRETRACE AI automatically runs with its built-in Autonomous 24/7 NASA Climatology Engine with zero external dependencies.
4. Click **Deploy**. Your live global deployment will be ready in under 60 seconds with full SPA URL routing support.

---

## 🧪 Comprehensive Automated Test Suite (22/22 Passing)

Run unit, integration, and scientific validation tests:

```powershell
pytest
```

Output:
```
backend/tests/test_api_endpoints.py ....                                 [ 18%]
backend/tests/test_harmonizer.py ....                                    [ 36%]
backend/tests/test_integration_pipeline.py .....                         [ 59%]
backend/tests/test_ml_engine.py .....                                    [ 81%]
backend/tests/test_scientific_validation.py ....                         [100%]
======================= 22 passed in 24.55s =======================
```

---

## 📚 Complete Technical & Scientific Documentation

The complete, unabridged technical documentation, scientific formulations, API specifications, and operational manuals have been consolidated into a single master document:

👉 **[`DOCUMENTATION.md`](DOCUMENTATION.md)**

It comprehensively covers:
- **Scientific Harmonization:** MODIS ($1\text{ km}$) vs VIIRS ($375\text{ m}$) sensor physics, 10 km sinusoidal projection, overlap scaling $\alpha(m)$, and HDI.
- **AI/ML Modules:** Great-circle Haversine DBSCAN, Mann-Kendall trend test, Seasonal Auto-Regressive forecasting with 95% CI, Biome Fingerprint cosine similarity, and deterministic assistant.
- **System Architecture & API:** Pure ASGI security middleware, FastAPI routes, and ReportLab PDF engine.
- **Database Schema:** SQLite spatial caching and provenance tables.
- **User Guide & Deployment:** AOI selection, GeoJSON polygon clipping, calendar drill-down, and Docker setup.

---

## 👥 NASA Space Apps Challenge 2026 Team
- **Team Name:** Astro-Avengers
- **Region Focus:** Surat, Gujarat, India  
- **Lead Developer & Geospatial Data Engineer:** [@rushi-7388](https://github.com/rushi-7388)  
- **Hackathon Challenge:** [Harmonization of MODIS and VIIRS Active Fire Hotspots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
