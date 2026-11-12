# FIRETRACE AI - Complete System Architecture Specification

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Document Reference:** FIRETRACE-ARCH-V2.0  

---

## 1. System Overview

FIRETRACE AI is architected as a high-performance, decoupled geospatial intelligence platform comprising:
1. **Frontend Presentation Layer:** React 18, Vite, Tailwind CSS, Leaflet/MapLibre, Recharts, and D3.js.
2. **Scientific Backend Engine:** Python 3.13, FastAPI, NumPy, Pandas, SciPy, Scikit-learn, and ReportLab.
3. **Relational Data & Provenance Layer:** SQLite (zero-config local runtime) and PostgreSQL + PostGIS (production container runtime).
4. **NASA Earth Observation Gateway:** Secure server-side NASA FIRMS API connector with automatic date batching, MD5 caching, and physics-calibrated statistical simulation fallback.

```
+----------------------------------------------------------------------------------------------------+
|                                    REACT + VITE FRONTEND                                           |
|  Executive Dashboard | Smart AOI Map | Burning Calendar | Anomaly Engine | AI Studio | Reports     |
+-------------------------------------------------+--------------------------------------------------+
                                                  | REST API (JSON / GeoJSON / CSV / PDF)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    FASTAPI BACKEND CORE                                            |
|  - Router Layer: /api/hotspots, /api/harmonize, /api/calendar, /api/ml/*, /api/export/*           |
|  - Ingestion Engine: NASA FIRMS 10-day NRT / 30-day SP batching, rate-limiting, cKDTree collocation |
|  - Harmonization: Sinusoidal equal-area 10 km grid, monthly scaling alpha(m), HDI formulation      |
|  - AI/ML Studio: Great-circle DBSCAN clustering, Mann-Kendall regime test, SAR forecasting         |
|  - Export Service: ReportLab PDF dossiers, RFC 7946 GeoJSON, Selective CSV tables                 |
+-------------------------------------------------+--------------------------------------------------+
                                                  | Relational DDL & SQL
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                DATABASE & PROVENANCE LAYER                                         |
|  - satellites (TERRA, AQUA, SNPP, NOAA20, NOAA21)                                                 |
|  - sensors (MODIS 1000m, VIIRS 375m)                                                              |
|  - data_ingestion_logs (source, dates, record counts, execution status, timestamps)                |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Multi-Resolution Spatial-Temporal Discretization

To solve the central problem-MODIS ($1\text{ km}$, 2000+) vs VIIRS ($375\text{ m}$, 2012+) detection disparities:
1. **Equal-Area Sinusoidal Grid (10 km standard):**
   $$y = R_{\text{earth}} \cdot \phi \cdot \frac{\pi}{180}$$
   $$x = R_{\text{earth}} \cdot \lambda \cdot \frac{\pi}{180} \cdot \cos(\phi)$$
   Coordinates $(\phi, \lambda)$ are discretized into constant $100\text{ km}^2$ equal-area spherical bins, eliminating the high-latitude distortion of standard geographic grids.
2. **Empirical Overlap Scaling Factor $\alpha(m)$:**
   Derived from the 10-year collocated overlap period (2012–2022, Schroeder & Giglio):
   $$N_{\text{harm}} = N_{\text{MODIS}} + \alpha(m) \cdot N_{\text{VIIRS}}$$
   Where $\alpha(m) \in [0.33, 0.38]$ reflects regional bimodal seasonality, fuel moisture, and canopy attenuation.
3. **Unified Hotspot Density Index (HDI):**
   $$\text{HDI} = \left(\frac{N_{\text{harm}}}{A_{\text{active}}}\right) \times 1000$$

---

## 3. Four Core Complementary Metrics Architecture

FIRETRACE AI preserves metric separation throughout the entire platform:
1. **Raw Hotspot Count:** Exact detections separated by satellite (`TERRA`, `AQUA`, `SNPP`, `NOAA20`, `NOAA21`) and sensor family (`MODIS` vs `VIIRS`).
2. **Harmonized Activity Index (HDI):** Calibrated continuous 24-year index ($2000 - 2024$) enabling unbiased multi-decadal trend analysis.
3. **Fire Radiative Power (FRP):** Aggregated thermal radiative energy release rate in Megawatts ($\text{MW}$), capturing sub-pixel combustion intensity.
4. **Detection Coverage & Quality Completeness:** Explicitly separates **true zero fire passes** from **missing observations / pre-launch periods / cloud obstruction**.

---

## 4. Security & Compliance Architecture

- **Server-Side API Key Resolution:** NASA keys are resolved strictly in backend environments (`NASA_MAP_KEY` / `FIRMS_API_KEY`). Zero tokens exposed to frontend bundles.
- **Offline / Sandboxed Resilience:** When keys are absent or network is isolated, the platform activates a NASA climatology-grounded synthetic simulation engine preserving bimodal Indian fire regimes and lognormal FRP distributions.
- **Zero Third-Party Map Key Dependencies:** Completely removed CARTO raster tiles; uses open, free Esri Dark Canvas, Esri Satellite, and OpenStreetMap tiles.

