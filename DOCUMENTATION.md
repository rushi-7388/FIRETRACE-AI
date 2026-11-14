# FIRETRACE AI — Master System & Scientific Documentation

**Project:** FIRETRACE AI  
**Event:** 2026 NASA Space Apps Challenge  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Document Type:** Consolidated Master Technical & Scientific Reference  
**Version:** 3.0 (Production Harmonized Architecture)  

---

## Table of Contents
1. [Executive Summary & NASA Challenge Objectives](#1-executive-summary--nasa-challenge-objectives)
2. [Scientific Harmonization Methodology](#2-scientific-harmonization-methodology)
   - [2.1 Sensor Discrepancies (MODIS vs. VIIRS)](#21-sensor-discrepancies-modis-vs-viirs)
   - [2.2 6-Stage Harmonization Pipeline](#22-6-stage-harmonization-pipeline)
   - [2.3 10 km Equal-Area Sinusoidal Projection](#23-10-km-equal-area-sinusoidal-projection)
   - [2.4 Empirical Scaling Formulation α(m) & HDI](#24-empirical-scaling-formulation-αm--hdi)
   - [2.5 Baseline Median & Anomaly Detection (Z-Score)](#25-baseline-median--anomaly-detection-z-score)
3. [AI/ML & Statistical Intelligence Architecture](#3-aiml--statistical-intelligence-architecture)
   - [3.1 Haversine DBSCAN Spatial-Temporal Clustering](#31-haversine-dbscan-spatial-temporal-clustering)
   - [3.2 Non-Parametric Mann-Kendall & Sen's Slope Trend Analysis](#32-non-parametric-mann-kendall--sens-slope-trend-analysis)
   - [3.3 Seasonal Auto-Regressive (SAR) Forecasting with 95% CI](#33-seasonal-auto-regressive-sar-forecasting-with-95-ci)
   - [3.4 Biome Fingerprint Engine (Cosine Vector Similarity)](#34-biome-fingerprint-engine-cosine-vector-similarity)
   - [3.5 Deterministic Natural Language Assistant](#35-deterministic-natural-language-assistant)
4. [System Architecture & Engineering Stack](#4-system-architecture--engineering-stack)
   - [4.1 Architecture Diagram & Component Topology](#41-architecture-diagram--component-topology)
   - [4.2 Security, High-Performance Pure ASGI Middleware & Circuit Breakers](#42-security-high-performance-pure-asgi-middleware--circuit-breakers)
5. [Complete REST API Reference](#5-complete-rest-api-reference)
6. [Database Schema & Data Dictionary](#6-database-schema--data-dictionary)
7. [User Guide & Operational Manual](#7-user-guide--operational-manual)
   - [7.1 Platform Navigation (9 Dedicated Hubs)](#71-platform-navigation-9-dedicated-hubs)
   - [7.2 Area of Interest (AOI) Workflows & Polygon Clipping](#72-area-of-interest-aoi-workflows--polygon-clipping)
   - [7.3 Burning Activity Calendar Matrix](#73-burning-activity-calendar-matrix)
   - [7.4 Multi-Format Dossier & Data Export](#74-multi-format-dossier--data-export)
8. [Deployment, Local Setup & Testing](#8-deployment-local-setup--testing)

---

## 1. Executive Summary & NASA Challenge Objectives

Satellite instruments have monitored thermal active fire anomalies across the globe for over two decades. However, this record is bifurcated across two distinct sensor generations:
1. **MODIS** aboard Terra and Aqua satellites ($1\text{ km}$ spatial resolution at nadir, operational since 2000/2002, nearing decommissioning).
2. **VIIRS** aboard Suomi-NPP, NOAA-20, and NOAA-21 ($375\text{ m}$ spatial resolution at nadir, operational from 2012 onwards).

Because VIIRS has higher spatial resolution, continuous scan geometry, and enhanced sensor sensitivity, it detects **300% to 450% more hotspots** than MODIS over identical spatiotemporal boundaries. Simply concatenating the records creates an artificial surge in 2012, misleading fire managers, emergency responders, and climatologists.

**FIRETRACE AI** solves this challenge by delivering:
- A scientifically grounded **Harmonized Burning Activity Calendar (2000–2026)**.
- Discretization on a **10 km equal-area sinusoidal grid** ($100\text{ km}^2$ constant cell surface area).
- Empirical scaling calibration ($\alpha(m)$) based on the 10-year overlap epoch (2012–2022).
- Historical climatological median anomaly baseline calculation ($Z \ge 2.0$ detection).
- Full regional and custom AOI selection (Bounding Box, Leaflet Freehand Draw, and GeoJSON Point-in-Polygon clipping).
- Multi-format exports: RFC 7946 GeoJSON, standardized CSV tables, and publication-ready ReportLab PDF dossiers.

---

## 2. Scientific Harmonization Methodology

### 2.1 Sensor Discrepancies (MODIS vs. VIIRS)

| Parameter | MODIS (Terra / Aqua) | VIIRS (S-NPP / NOAA-20 / NOAA-21) |
|---|---|---|
| **Launch Epoch** | Terra (1999/2000), Aqua (2002) | S-NPP (2011/2012), NOAA-20 (2017), NOAA-21 (2022) |
| **Nadir Spatial Resolution** | $1,000\text{ m} \times 1,000\text{ m}$ ($1.0\text{ km}^2$) | $375\text{ m} \times 375\text{ m}$ ($0.14\text{ km}^2$) |
| **Scan Edge Pixel Distortion** | Grows up to $4.8\times$ cross-track, $2.0\times$ along-track ($9.6\text{ km}^2$) | Constrained to $\sim 1.5\times$ ($0.21\text{ km}^2$) via pixel aggregation |
| **Swath Width** | $2,330\text{ km}$ (orbital scan gaps at low latitudes) | $3,040\text{ km}$ (full continuous pole-to-pole swath) |
| **Primary Fire Band** | Channel 21/22 ($3.96\ \mu\text{m}$, sat. $\sim 500\text{ K}$) | Band I4 ($3.74\ \mu\text{m}$, sat. $\sim 367\text{ K}$) |
| **Detection Threshold** | Detects flaming fires $\ge 100\text{ m}^2$ under clear sky | Detects small flaming fires down to $\ge 5\text{ m}^2$ |
| **Confidence Format** | Continuous percentage integer ($0\% - 100\%$) | Categorical: Low (`l`), Nominal (`n`), High (`h`) |

---

### 2.2 6-Stage Harmonization Pipeline

```
+-----------------------------------------------------------------------------------+
| Stage A: Sensor-Specific Normalization (Confidence Mapping: h->90, n->60, l->30)  |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage B: Spatial-Temporal Association (Δd <= 1.0 km, Δt <= 30 min via cKDTree)    |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage C: Observation Consolidation (Dual-flagging without destructive suppression)|
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage D: Equal-Area Sinusoidal Discretization & α(m) Empirical Scaling            |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage E: Data Quality & Missingness Attribution (Satellite coverage tracking)     |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage F: 27-Year Climatology Baseline & Z-Score Anomaly Derivation                |
+-----------------------------------------------------------------------------------+
```

1. **Stage A (Sensor Normalization):** Preserves raw radiometry and maps VIIRS confidence categories into normalized scale:
   $$\text{conf}_{\text{norm}} = \begin{cases} 90 & \text{if } \text{conf} = \text{'h'} \\ 60 & \text{if } \text{conf} = \text{'n'} \\ 30 & \text{if } \text{conf} = \text{'l'} \end{cases}$$
2. **Stage B & C (Spatiotemporal Association):** Identifies simultaneous observations within $\Delta d \le 1.0\text{ km}$ and $\Delta t \le 30\text{ min}$ using SciPy `cKDTree`. Detections are flagged with `is_collocated = True` without deleting raw records, preserving radiometric provenance.
3. **Stage D (Discretization & Scaling):** Projects coordinates to a 10 km sinusoidal grid and applies empirical monthly overlap scaling $\alpha(m)$.
4. **Stage E (Quality Assessment):** Accounts for sensor degradation, instrument calibration transitions (Suomi-NPP to NOAA-20/21), and orbital coverage gaps.
5. **Stage F (Anomaly Derivation):** Evaluates observations against the 27-year monthly median baseline.

---

### 2.3 10 km Equal-Area Sinusoidal Projection

To prevent geographic area distortion across varying latitudes:
$$y = R_{\text{earth}} \cdot \phi \cdot \frac{\pi}{180}$$
$$x = R_{\text{earth}} \cdot \lambda \cdot \frac{\pi}{180} \cdot \cos(\phi)$$
$$\text{Cell Row} = \left\lfloor \frac{y}{\Delta_{\text{grid}}} \right\rfloor, \quad \text{Cell Col} = \left\lfloor \frac{x}{\Delta_{\text{grid}}} \right\rfloor$$
Where $R_{\text{earth}} = 6371.0088\text{ km}$, $\Delta_{\text{grid}} = 10.0\text{ km}$, producing constant $A_{\text{cell}} = 100.0\text{ km}^2$.

---

### 2.4 Empirical Scaling Formulation α(m) & HDI

Based on 10 years of collocated observations (2012–2022):
$$N_{\text{harm}} = N_{\text{MODIS}} + \alpha(m) \cdot N_{\text{VIIRS}}$$

#### Monthly Coefficients $\alpha(m)$
| Month | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **$\alpha(m)$** | 0.33 | 0.34 | 0.36 | 0.37 | 0.38 | 0.37 | 0.35 | 0.34 | 0.33 | 0.34 | 0.35 | 0.33 |

#### Hotspot Density Index (HDI)
$$\text{HDI} = \left( \frac{N_{\text{harm}}}{A_{\text{active}}} \right) \times 1000$$
Where $A_{\text{active}}$ is the active surface area in $\text{km}^2$.

---

### 2.5 Baseline Median & Anomaly Detection (Z-Score)

For each calendar month $m \in [1, 12]$, historical median $\tilde{\mu}_m$ and standard deviation $\sigma_m$ are calculated over the 2000–2026 baseline:
$$Z_m = \frac{\text{HDI}_m - \tilde{\mu}_m}{\sigma_m}$$

* **Nominal:** $|Z| < 1.0$ (Normal seasonal envelope)
* **Elevated:** $1.0 \le Z < 2.0$ (Above average burning)
* **Critical Anomaly:** $Z \ge 2.0$ (Statistically extreme event, $>95\text{th}$ percentile)

---

## 3. AI/ML & Statistical Intelligence Architecture

### 3.1 Haversine DBSCAN Spatial-Temporal Clustering
- **Algorithm:** Density-Based Spatial Clustering of Applications with Noise using great-circle Haversine distance.
- **Formulation:**
  $$d_{\text{hav}}(p_1, p_2) = 2 R \arcsin \left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Hyperparameters:** $\epsilon = 12.0\text{ km}$, $\text{MinPts} = 3$.
- **Outputs:** Cluster centroid $(\bar{\phi}, \bar{\lambda})$, bounding polygon, spot count, mean Fire Radiative Power (FRP), and multi-day temporal persistence rating.

---

### 3.2 Non-Parametric Mann-Kendall & Sen's Slope Trend Analysis
- **Purpose:** Identifies monotonic 27-year climate trends robust to non-normal distributions and sensor transitions.
- **Mann-Kendall Statistic ($S$):**
  $$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^n \text{sgn}(x_j - x_k)$$
- **Sen's Median Slope ($Q$):**
  $$Q = \text{Median} \left\{ \frac{x_j - x_k}{j - k} \quad \forall \; 1 \le k < j \le n \right\}$$
- Yields true decadal rate of change ($\Delta\text{HDI}/\text{year}$) unaffected by single-year outlier wildfire episodes.

---

### 3.3 Seasonal Auto-Regressive (SAR) Forecasting with 95% CI
- **Decomposition:** $\text{HDI}_t = T_t + S_t + R_t$ (Sen's trend $T_t$, 12-month climatology median $S_t$, and $AR(1)$ residual $R_t$).
- **Uncertainty Quantification:** 80% ($Z=1.28$) and 95% ($Z=1.96$) forecast intervals expanding with horizon $\sqrt{h}$.
- **Backtesting Validation:** Automatically computes MAE, RMSE, and MAPE across the most recent 12-month held-out historical window.

---

### 3.4 Biome Fingerprint Engine (Cosine Vector Similarity)
- Computes an 8-dimensional normalized burning profile vector:
  $$\vec{V} = [\text{Peak Month}, \text{Season Length}, \text{Kurtosis}, \text{Night Fraction}, \text{Mean FRP}, \text{FRP P90}, \text{Variability}, \text{Trend Slope}]$$
- Evaluates Cosine Similarity against standard reference biomes:
  $$\text{Sim}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
- Categorizes region as *Tropical Moist Forest Deforestation*, *Savanna/Grassland Fire*, *Temperate Boreal Wildfire*, or *Agricultural Stubble Residue*.

---

### 3.5 Deterministic Natural Language Assistant
- Eliminates LLM hallucinations for operational safety.
- Parses incoming natural language queries for:
  - Temporal boundaries (e.g., "in 2021", "March to May", "historical peak")
  - Spatial scope (selected AOI or preset)
  - Analytical intents (`PEAK_SEASON`, `TREND_DIRECTION`, `ANOMALY_YEARS`, `SENSOR_CONTRIBUTION`, `FRP_SUMMARY`)
- Calculates exact answers deterministically from harmonized data structures with scientific citations.

---

## 4. System Architecture & Engineering Stack

### 4.1 Architecture Diagram & Component Topology

```
+----------------------------------------------------------------------------------------------------+
|                                    REACT + VITE FRONTEND (PORT 5173)                               |
|  - Leaflet / MapLibre (Draw Controls, GeoJSON Point-in-Polygon Ray-Casting, Continuous Timeline)   |
|  - BurnCalendar (12-Month x 27-Year Grid, Accessible Color Ramps, Cell Drill-Down)                |
|  - Recharts / D3.js (Overlaps, Decadal FRP, Biome Radar, SAR Forecast with 95% CI)                |
|  - Zustand Global Store (useAppStore: 30s Timeout, Data Engine Transparent Badge)                 |
+-------------------------------------------------+--------------------------------------------------+
                                                  | REST API (HTTP / JSON / GeoJSON / CSV / PDF)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    FASTAPI BACKEND (PORT 8000)                                     |
|  - Pure ASGI UnifiedDefenseMiddleware (CORS, Rate-Limiting, Security Headers, Python 3.13 Ready)   |
|  - Router: /api/hotspots, /api/harmonize, /api/calendar, /api/ml/*, /api/export/*                  |
|  - Ingestion Gateway: NASA FIRMS 10-day NRT / 30-day SP Chunks, Multi-Year >180d Auto-Bypass        |
|  - Scientific Harmonizer: 10 km Sinusoidal Equal-Area Grid, alpha(m) Monthly Scaling               |
|  - SQLite Spatial Cache: Persistent Local Hotspot Store (query_hotspots_from_db)                   |
|  - PDF Generation Service: ReportLab Vector Graphics Engine                                        |
+-------------------------------------------------+--------------------------------------------------+
                                                  | Relational DDL & SQL
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                DATABASE & PROVENANCE (firetrace.db)                                |
|  - satellites (TERRA, AQUA, SNPP, NOAA20, NOAA21)                                                 |
|  - sensors (MODIS 1000m, VIIRS 375m)                                                              |
|  - data_ingestion_logs (audit provenance, execution timestamps, record counts)                    |
|  - cached_hotspots (spatial SQLite cache for offline speed & network resilience)                   |
+----------------------------------------------------------------------------------------------------+
```

---

### 4.2 Security, High-Performance Pure ASGI Middleware & Circuit Breakers

1. **Pure ASGI Middleware (`UnifiedDefenseMiddleware`):** Replaces legacy Starlette `BaseHTTPMiddleware` to prevent AnyIO event-loop deadlocks in Python 3.13 while providing:
   - Dynamic CORS authorization.
   - Per-IP sliding-window rate limiting.
   - Comprehensive security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
2. **FIRMS Circuit Breaker & Multi-Year Routing:**
   - Single requests exceeding 180 days (e.g., 27-year calendar queries) bypass sequential chunk bombardment (preventing 1,580 HTTP requests and NASA 429 rate-limiting blocks) and route directly through the autonomous climatology engine and SQLite spatial cache in $<100\text{ms}$.

---

## 5. Complete REST API Reference

**Base URL:** `http://localhost:8000/api`  
**Swagger UI:** `http://localhost:8000/docs` | **ReDoc:** `http://localhost:8000/redoc`

| Method | Endpoint | Description | Key Parameters / Payload |
|---|---|---|---|
| `GET` | `/status` | System health, NASA FIRMS status, and capabilities | None |
| `GET` | `/provenance` | Constellation registry, sensors, and ingestion audit log | None |
| `GET` | `/hotspots` | Raw satellite fire detections in GeoJSON FeatureCollection | `bbox`, `start_date`, `end_date`, `sensor`, `limit` |
| `POST` | `/harmonize` | Full 10 km sinusoidal harmonization pipeline | `bbox`, `start_date`, `end_date`, `satellites`, `grid_resolution_km` |
| `GET` | `/calendar` | 12-month × 27-year burning activity matrix & anomalies | `bbox`, `start_date`, `end_date`, `satellites` |
| `GET` | `/validation/overlap` | Cross-sensor overlap (2012–2022) statistical metrics | `bbox` |
| `GET` | `/ml/clusters` | Haversine DBSCAN spatial-temporal fire clusters | `bbox`, `start_date`, `end_date`, `eps_km`, `min_samples` |
| `GET` | `/ml/regime` | Mann-Kendall monotonic trend test & Sen's slope | `bbox`, `start_date`, `end_date` |
| `GET` | `/ml/forecast` | Seasonal Auto-Regressive forecast with 95% CI & RMSE | `bbox`, `horizon_months` (1-12) |
| `GET` | `/ml/fingerprint` | 8-dimension biome vector & archetype classification | `bbox` |
| `POST`| `/ml/assistant/query` | Deterministic natural language query answering | `{"query": string, "bbox": string}` |
| `GET` | `/export/csv` | Download harmonized data as RFC 4180 CSV | `bbox`, `start_date`, `end_date` |
| `GET` | `/export/geojson` | Download 10 km grid cells as RFC 7946 GeoJSON | `bbox`, `start_date`, `end_date` |
| `GET` | `/export/pdf` | Generate publication-ready ReportLab PDF dossier | `bbox`, `start_date`, `end_date` |

---

## 6. Database Schema & Data Dictionary

The persistence layer (`backend/database/firetrace.db`) manages provenance and spatial cache:

```sql
-- Satellites Registry
CREATE TABLE satellites (
    satellite_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agency TEXT DEFAULT 'NASA',
    launch_date TEXT,
    status TEXT DEFAULT 'active'
);

-- Sensor Specifications
CREATE TABLE sensors (
    sensor_id TEXT PRIMARY KEY,
    satellite_id TEXT REFERENCES satellites(satellite_id),
    name TEXT NOT NULL,
    spatial_resolution_m INTEGER NOT NULL,
    swath_width_km REAL NOT NULL
);

-- Data Ingestion Audit Trail
CREATE TABLE data_ingestion_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial SQLite Hotspot Cache
CREATE TABLE cached_hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    brightness REAL,
    scan REAL,
    track REAL,
    acq_date TEXT NOT NULL,
    acq_time TEXT,
    satellite TEXT,
    instrument TEXT,
    confidence REAL,
    version TEXT,
    bright_t31 REAL,
    frp REAL,
    daynight TEXT,
    sensor TEXT,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cached_hotspots_spatial_time ON cached_hotspots(latitude, longitude, acq_date);
```

---

## 7. User Guide & Operational Manual

### 7.1 Platform Navigation (9 Dedicated Hubs)

1. **Executive Dashboard (`/`):** 40/60 map-to-calendar view, key performance indicators (Total Detections, Harmonized HDI, Baseline Anomaly Status, Sensor Transition Delta), and active data engine badge.
2. **Smart AOI Map (`/map`):** Interactive global Leaflet map, CircleMarkers color-coded by sensor, FRP heatmaps, polygon drawing tools, GeoJSON boundary upload, and continuous date timeline scrubber.
3. **Season Calendar (`/calendar`):** 12-month (columns) × 27-year (rows, 2000–2026) matrix with accessible color ramps, missing-data indicators, and click drill-down showing underlying daily observations.
4. **Overlap Lab (`/compare`):** 2012–2022 cross-sensor overlap sensitivity analysis, detection ratios, and $\alpha(m)$ calibration inspection.
5. **Regional & FRP (`/analytics`):** Decadal FRP distribution histograms, sensor-stratified radiative power curves, and diurnal day/night breakdowns.
6. **Anomaly Engine (`/anomalies`):** Multi-decadal baseline analysis, standardized $Z$-score rankings, and critical threshold alerts ($Z \ge 2.0$).
7. **AI Studio (`/ai-intel`):** DBSCAN spatial clusters, Mann-Kendall regime shift analysis, SAR forecasting with 95% confidence intervals, Biome Fingerprint radar, and the Natural Language Assistant.
8. **Reports & Downloads (`/reports`):** Direct export of harmonized datasets in CSV, GeoJSON, or full ReportLab PDF executive dossiers.
9. **Scientific Methodology (`/methodology`):** Peer-reviewed literature references, sensor physics, sinusoidal math formulas, and empirical scaling validation.

---

### 7.2 Area of Interest (AOI) Workflows & Polygon Clipping

- **Preset AOIs:** One-click presets for Surat & South Gujarat (Official Challenge Focus: `72.0, 20.0, 74.5, 22.0`), Greater Gujarat, Amazon Basin, and Southeastern Australia.
- **Interactive Leaflet Draw:** Use the freehand Polygon or Rectangle tools to define custom geographic boundaries.
- **GeoJSON Boundary Upload & Point-in-Polygon Clipping:**
  - Upload custom GeoJSON boundaries (districts, reserves, jurisdictions).
  - The map renders the irregular boundary in neon-cyan overlay.
  - The client applies **Ray-Casting Point-in-Polygon (`isPointInRing`)** filtering, ensuring hotspots outside the irregular polygon boundary are strictly excluded from analytics and calendar computations.

---

### 7.3 Burning Activity Calendar Matrix

- **Temporal Coverage:** 2000 to 2026 (27 complete years).
- **Color Scales:** Scientifically calibrated, accessible color ramps (Viridis, Plasma, Fire Amber, High-Contrast Accessible) with linear and logarithmic scaling.
- **Quality Indicators:** Striped diagonal patterns indicate missing or insufficient satellite coverage (e.g., pre-launch periods or orbital gaps).
- **Interactive Drilldown:** Clicking any cell displays a modal showing daily time-series breakdowns, sensor breakdown percentages (MODIS vs. VIIRS), and individual hotspot tables.

---

### 7.4 Multi-Format Dossier & Data Export

- **CSV Export:** RFC 4180 compliant tables with full geospatial coordinates, acquisition dates, satellite, sensor, FRP, and confidence values.
- **GeoJSON Export:** RFC 7946 compliant FeatureCollection of 10 km sinusoidal equal-area cells with properties: `hdi`, `modis_count`, `viirs_count`, `harmonized_count`, `anomaly_zscore`.
- **PDF Dossier:** Vector-rendered ReportLab executive report including NASA mission briefing, executive metrics table, embedded calendar matrix, and methodology citations.

---

## 8. Deployment, Local Setup & Testing

### 8.1 One-Click Local Start (Windows)
```powershell
.\start.bat
```
Launches FastAPI backend on `http://localhost:8000` and Vite frontend on `http://localhost:5173`.

### 8.2 Manual Setup

**Backend (Python 3.10 - 3.13):**
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend (Node.js 18+):**
```powershell
cd frontend
npm install
npm run dev
```

### 8.3 Docker Container Deployment
```powershell
docker-compose up --build
```
- Multi-stage build packages frontend into Nginx static delivery and containerizes FastAPI backend with shared volumes.

### 8.4 Automated Test Suite
```powershell
pytest -v
```
**Test Coverage (24/24 Tests Passing):**
- `test_api_endpoints.py`: All REST routes, status, provenance, calendar, and exports.
- `test_harmonizer.py`: 10 km sinusoidal projection, overlap scaling $\alpha(m)$, and Hotspot Density Index.
- `test_integration_pipeline.py`: End-to-end data flow from ingestion to calendar matrix.
- `test_ml_engine.py`: DBSCAN clustering, Mann-Kendall regime test, and SAR forecasting.
- `test_scientific_validation.py`: Physical constraints, non-negativity, and baseline median anomaly verification.

