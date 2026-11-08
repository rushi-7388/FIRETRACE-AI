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

> **Core Objective:** Scientifically harmonize more than two decades of satellite active fire observation records (MODIS Collection 6.1 on Terra/Aqua and VIIRS 375m on Suomi-NPP, NOAA-20, and NOAA-21) into a unified, sensor-agnostic **Burning Activity Calendar** and fire intelligence dashboard for early warning, land managers, and emergency response.

---

## 🧭 Why Direct Merging Fails: The Scientific Problem

When NASA's VIIRS (375 m pixel) became operational alongside MODIS (1000 m pixel), raw active fire detections spiked by **~3.7× for the identical burning conditions**. This is caused by:
1. **Finer Spatial Resolution:** VIIRS detects smaller, low-intensity agricultural clearing and smoldering fires beneath canopy thresholds that MODIS cannot resolve.
2. **Differing Overpass Geometries:** Observation schedules (Terra morning/evening vs. Aqua & S-NPP afternoon at ~13:30 local) introduce diurnality variations.
3. **Incompatible Confidence Standards:** MODIS utilizes a continuous Bayesian probability ($0\text{--}100\%$), while VIIRS assigns categorical detection flags (`Low`, `Nominal`, `High`).

**Directly combining raw hotspot records creates severe artificial spikes, misleading emergency managers into believing fire frequency escalated dramatically.**

---

## 🔬 The Solution: Sensor-Aware Harmonization Engine

```
[ NASA RAW OBSERVATIONS ]
  ├── MODIS (Terra & Aqua, 1 km, 2000–present)
  └── VIIRS (Suomi-NPP, NOAA-20, NOAA-21, 375 m, 2012–present)
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
  ├── 25-Year Climatological Median Baseline (January – December)
  └── Standardized Z-Score Anomaly Derivation:
        Z = ( HDI - Median_m ) / IQR_m, flagged when |Z| ≥ 1.5σ
```

---

## 🖥️ 8 Complete Application Pages

| # | Page | Route | Description |
|---|---|---|---|
| **01** | **Executive Dashboard** | `/` | Real-time incident command center, active fire metrics, and Surat fire status. |
| **02** | **Global Fire Map** | `/map` | Interactive Leaflet GIS map with multi-satellite filters (**Terra, Aqua, S-NPP, NOAA-20, NOAA-21**), AOI polygon drawing, and Fire Radiative Power (FRP) intensity markers. |
| **03** | **Burning Activity Calendar** | `/calendar` | **25-Year Heatmap Calendar (2000–Present)**, 25-year monthly medians baseline table, and **Observation Inspector Modal** to inspect underlying NASA telemetry on click. |
| **04** | **MODIS vs. VIIRS Comparison** | `/compare` | Side-by-side sensor bias visualizer with 2012–2022 overlap ratio analysis. |
| **05** | **Regional Analytics** | `/analytics` | **Surat & South Gujarat deep-dive**: Decadal activity (2000s vs 2010s vs 2020s), post-harvest sugarcane clearing cycles, and The Dangs forest fringe dynamics. |
| **06** | **Anomaly Intelligence** | `/anomalies` | **Explainable Anomaly Engine**: Top ranked historical fire anomalies with severity classes, driver explanations, and official NASA scientific disclaimers. |
| **07** | **Reports & Downloads** | `/reports` | Multi-format exports (**CSV**, **Spatial GeoJSON**, **Structured JSON**, and **PDF Executive Summary**) with complete data provenance citations. |
| **08** | **Scientific Methodology** | `/methodology` | Mathematical equations, 2012–2022 calibration table, and peer-reviewed citations. |

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

---

## 🧪 Scientific Validation Tests

Run unit tests verifying grid projection, confidence normalization, and harmonization math:

```powershell
cd backend
python -m pytest -v
```

Output:
```
tests/test_harmonizer.py::test_sinusoidal_grid_projection PASSED         [ 25%]
tests/test_harmonizer.py::test_confidence_normalization PASSED           [ 50%]
tests/test_harmonizer.py::test_collocated_duplicate_detection PASSED     [ 75%]
tests/test_harmonizer.py::test_harmonize_observations_pipeline PASSED    [100%]
============================== 4 passed in 7.65s ==============================
```

---

## 👥 NASA Space Apps Challenge 2026 Team
- **Region:** Surat, Gujarat, India  
- **Lead Developer & Geospatial Data Engineer:** [@rushi-7388](https://github.com/rushi-7388)  
- **Hackathon Entry:** [MODIS and VIIRS Hot Spots Harmonization](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
