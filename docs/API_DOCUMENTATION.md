# FIRETRACE AI - Comprehensive API Documentation

**Base URL:** `http://localhost:8000/api`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)  
**Version:** 1.0.0  

---

## 1. System & Provenance Endpoints

### `GET /api/status`
Returns service health, NASA FIRMS ingestion mode, and system capabilities.
```json
{
  "status": "online",
  "service": "FIRETRACE-AI",
  "nasa_firms_mode": "CALIBRATED_SYNTHETIC_SIMULATION",
  "capabilities": ["HOTSPOT_DENSITY_INDEX", "DBSCAN_CLUSTERING", "SAR_FORECASTING"]
}
```

### `GET /api/provenance`
Returns registered satellite constellations, sensor specifications, and live database ingestion audit logs.

---

## 2. Satellite Hotspot Observations

### `GET /api/hotspots`
Returns a GeoJSON FeatureCollection of satellite fire detections.
- **Parameters:**
  - `bbox` (string): `min_lon,min_lat,max_lon,max_lat` (default: Surat region `72.0,20.0,74.5,22.0`).
  - `start_date` (string, ISO): `YYYY-MM-DD`.
  - `end_date` (string, ISO): `YYYY-MM-DD`.
  - `sensor` (string): `modis`, `viirs`, or `both` (default: `both`).
  - `limit` (int): Maximum records returned (default: 500).

---

## 3. Scientific Harmonization & Burning Calendar

### `POST /api/harmonize`
Executes the full multi-stage harmonization pipeline across equal-area sinusoidal cells.
- **Payload:**
```json
{
  "bbox": "72.0,20.0,74.5,22.0",
  "start_date": "2020-01-01",
  "end_date": "2024-04-01",
  "satellites": ["TERRA", "AQUA", "SNPP", "NOAA20", "NOAA21"],
  "grid_resolution_km": 10.0
}
```

### `GET /api/calendar`
Returns the 12-month × multi-year burning activity matrix for heatmap visualization.
- **Query Parameters:** `bbox`, `start_date`, `end_date`, `satellites`.
- **Response Structure:** Includes `rows` (monthly records), `daily` series, `calendar_matrix`, and `summary` (peak month, anomaly count, total spots).

### `GET /api/validation/overlap`
Returns empirical comparison statistics and monthly scaling table $\alpha(m)$ from the 2012–2022 collocated mission overlap period.

### `GET /api/anomalies/ranking`
Returns top historical fire anomalies ranked by standardized Z-score deviation with natural language explainable drivers.

---

## 4. AI & Statistical Intelligence Studio

### `POST /api/ml/clusters`
Executes Great-Circle Haversine DBSCAN clustering on active hotspots.
- **Payload:** `bbox`, `eps_km` (default: 12.0), `min_samples` (default: 3), `days_back` (default: 30).
- **Output:** Cluster IDs, centroids, FRP intensity, temporal duration, and persistence status (*"Single-Day Incident"*, *"Persistent Multi-Day Burning"*).

### `GET /api/ml/forecast`
Generates a 6-month forward experimental fire activity forecast using Seasonal Auto-Regression.
- **Query Parameters:** `bbox`, `horizon` (1 to 12 months).
- **Output:** Point forecast, shaded 80% & 95% confidence intervals, and 12-month holdout backtesting metrics (**MAE**, **RMSE**, **MAPE**).

### `GET /api/ml/regime-change`
Performs non-parametric **Mann-Kendall trend test** and **Sen's Slope Estimator** on annual burning intensity.
- **Output:** $S$ statistic, standardized $Z$, two-tailed $p$-value, annual slope rate, and significance indicator.

### `GET /api/ml/fingerprint`
Calculates a 12-month normalized burning profile and cosine similarity against reference global biomes.

### `POST /api/ml/compare-periods`
Compares Period A vs Period B to produce differential analytics ($\Delta\%$ activity, FRP shift, spatial centroid displacement).

### `POST /api/ml/assistant/query`
Deterministic Natural Language Fire Intelligence Assistant answering user questions from live data with zero hallucination.

---

## 5. Multi-Format Data Export

### `POST /api/export/data`
Exports observations or analytics in multiple formats.
- **Payload:**
```json
{
  "bbox": "72.0,20.0,74.5,22.0",
  "start_date": "2024-01-01",
  "end_date": "2024-04-01",
  "format": "csv",
  "data_type": "harmonized_monthly"
}
```
- **Supported Formats:** `csv`, `pdf_summary`, `geojson`, `json`.
- **Supported Data Types (CSV):** `all`, `harmonized_monthly`, `daily`, `anomalies`, `matched`, `raw_modis`, `raw_viirs`.

