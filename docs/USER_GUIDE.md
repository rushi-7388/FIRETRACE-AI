# FIRETRACE AI - Comprehensive User Guide & Operation Manual

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Team:** Astro-Avengers  
**Document Version:** 2.0 (Official User & Stakeholder Operational Manual)

---

## 1. Introduction & Navigation Architecture

FIRETRACE AI is a worldwide satellite-based burning activity intelligence platform designed for:
- Emergency managers & incident commanders
- Firefighters & regional response agencies
- Earth observation scientists & climatologists
- Environmental researchers & conservationists
- Land managers & agricultural authorities

### Main Navigation Bar

The platform is structured into 9 dedicated operational environments accessible from the persistent top navigation:

| Nav Tab | Route | Primary Capability |
|---|---|---|
| **Executive** | `/` | Command center with 40/60 map-to-calendar layout, 4 core metrics, and summary charts |
| **Smart AOI Map** | `/map` | Worldwide interactive geospatial map, circle markers, FRP heatmap, drawing controls, and timeline playback |
| **Season Calendar** | `/calendar` | 12-month × 25-year historical Burning Activity Calendar with missing-data indicators and click drilldown |
| **Overlap Lab** | `/compare` | 2012–2022 cross-sensor overlap sensitivity analysis, detection ratios, and $\alpha(m)$ calibration tables |
| **Regional & FRP** | `/analytics` | Decadal FRP distributions, sensor-stratified radiative power, and diurnal day/night breakdowns |
| **Anomaly Engine** | `/anomalies` | Multi-decadal baseline analysis, standardized Z-Scores, ranked anomaly events, and alert notifications |
| **AI Studio** | `/ai-intel` | DBSCAN clustering, Mann-Kendall regime change test, experimental forecasting, burning fingerprint, and NL assistant |
| **Reports & Quality**| `/reports` | Multi-dataset CSV downloads, GeoJSON exports, ReportLab executive PDF dossiers, and ingestion provenance |
| **Methodology** | `/methodology` | Scientific rationale, mathematical formulations, equal-area sinusoidal projection, and peer-reviewed literature citations |

---

## 2. Step-by-Step User Workflows

### 2.1 Setting Your Area of Interest (AOI)

1. Navigate to the top filter bar present on the **Executive** or **Smart AOI Map** page.
2. Choose from pre-configured regional presets:
   - **Surat & South Gujarat (Official Challenge Focus):** `72.0, 20.0, 74.5, 22.0`
   - **Ahmedabad / Central Gujarat:** `72.3, 22.8, 73.0, 23.3`
   - **Greater Gujarat Region:** `68.0, 20.0, 74.5, 24.5`
   - **Amazon Basin (Deforestation Arc):** `-65.0, -12.0, -55.0, -5.0`
   - **Southeastern Australia:** `145.0, -38.0, 152.0, -32.0`
3. Or manually draw a custom AOI:
   - Click the **Polygon Tool** or **Rectangle Tool** on the Leaflet map toolbar.
   - Click vertices on the map to define your boundary; double-click to close.
   - The bounding box and computed geodesic surface area ($\text{km}^2$) update automatically.
4. Or upload a custom **GeoJSON** polygon via the file uploader.

---

### 2.2 Investigating the Historical Burning Activity Calendar

1. Click **Season Calendar** in the top navigation.
2. The 12-month (columns) × 25-year (rows, 2000–2024) matrix renders with color intensity mapped to the selected metric.
3. Switch between analytical views using the selector:
   - **Harmonized Hotspot Density Index (HDI)** (Default): Inter-sensor consistent burning density.
   - **Raw Hotspot Count**: Unscaled satellite detections.
   - **Mean Fire Radiative Power (MW)**: Combustion energy release.
   - **Detection Coverage**: Distinguishes active detections, zero fires observed, and pre-launch periods.
4. **Cell Legend & Styling:**
   - *Light cream / yellow:* Low burning activity.
   - *Deep orange / red:* Peak burning activity.
   - *Hatched grey:* Pre-launch period (e.g. Terra pre-2000, VIIRS pre-2012).
   - *Clean dark neutral:* Valid satellite passes with 0 fires detected.
5. **Interactive Drilldown:**
   - Hover over any cell to see exact year, month, HDI, MODIS count, VIIRS count, mean FRP, and anomaly status.
   - Click a cell to display the daily observation breakdown and sensor distribution for that specific month.

---

### 2.3 Analyzing Anomalies & Historical Medians

1. Navigate to **Anomaly Engine**.
2. Select your historical baseline comparison period:
   - **Full Historical Record (2000–Present)**: 24-year long-term baseline.
   - **VIIRS Mission Era (2012–Present)**: Modern 375m high-resolution era.
   - **MODIS Mission Era (2000–2011)**: Baseline legacy record.
3. Inspect the Ranked Anomalies table:
   - Highlights months with extreme departure from historical median ($Z \ge 2.5$).
   - Explains the seasonal driver (e.g. *"May 2021 was 3.4σ above historical median due to prolonged dry pre-monsoon heatwave"*).
4. Review the **Satellite-Observation Alert Card**:
   - Clear disclaimer: *"Satellite-Observation Anomaly Alert • Not Confirmed Dispatch"*.

---

### 2.4 Using the Deterministic AI Intelligence Studio

1. Navigate to **AI Studio** (`/ai-intel`).
2. **DBSCAN Fire Clusters:**
   - Adjust cluster search radius $\epsilon$ (default $12\text{ km}$) and minimum samples (default $3$).
   - Click **Run Spatial Clustering** to group instantaneous detections into regional clusters and view persistence duration.
3. **Decadal Regime Change (Mann-Kendall):**
   - Click **Run Trend Analysis** to test for monotonic multi-decadal shifts.
   - Displays the Mann-Kendall $S$, standardized $Z$, $p$-value, and Sen's slope rate of change ($\Delta\text{HDI}/\text{year}$).
4. **Seasonal Forecasting:**
   - Select a 3, 6, or 12-month forward horizon.
   - Inspect the projected activity curve with shaded 80% and 95% confidence intervals and backtested error metrics (MAE, RMSE, MAPE).
5. **Global Burning Fingerprint:**
   - View your AOI's 12-month normalized burning profile and see the top matching Earth biome.
6. **Natural Language Assistant:**
   - Type questions such as:
     - *"Which month had the peak burning activity?"*
     - *"How does 2023 compare with historical medians?"*
     - *"Explain the difference between MODIS and VIIRS."*
   - Returns instantaneous, deterministic answers computed directly from telemetry arrays.

---

### 2.5 Generating Reports & Exporting Data

1. Navigate to **Reports & Quality** (`/reports`).
2. **Selective CSV Download:**
   - Choose your dataset slice: *All Hotspots*, *Harmonized Monthly Series*, *Daily Series*, *Collocated Pairs*, or *Anomalies Only*.
   - Click **Download Filtered CSV**.
3. **GeoJSON Export:**
   - Click **Export GeoJSON (RFC 7946)** for direct import into GIS software (QGIS, ArcGIS).
4. **Executive PDF Intelligence Dossier:**
   - Click **Generate Executive PDF Report**.
   - Downloads a formal multi-page PDF document generated via ReportLab containing:
     - Title, AOI bounds, date range
     - Satellite & sensor breakdown
     - 4 core analytical metrics summary
     - Top historical fire anomalies table
     - Methodology notes, data provenance, and NASA attribution.

