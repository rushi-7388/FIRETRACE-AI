# FIRETRACE AI - Satellite Data Dictionary & Attribute Specification

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Team:** Astro-Avengers  
**Document Version:** 2.0 (Official NASA Earthdata Harmonization Attribute Standard)

---

## 1. Overview & Canonical Data Model

NASA FIRMS distributes active fire hotspot records across multiple distinct satellite instruments with varying spatial resolutions, radiometric detection channels, and reporting conventions. 

FIRETRACE AI defines a **Canonical Observation Schema (`CANONICAL_COLS`)** that:
1. Preserves every original native instrument measurement without loss.
2. Formulates normalized fields (`confidence_norm`, `is_collocated`, `hdi`) to allow scientifically sound inter-sensor comparison.
3. Explicitly flags unavailable attributes rather than synthesizing false numbers.

---

## 2. Canonical Attribute Dictionary

| Attribute Name | Data Type | Native Source(s) | Valid Range / Format | Physical Meaning & Scientific Definition | Harmonization & Processing Rule |
|---|---|---|---|---|---|
| `latitude` | `float64` | MODIS, VIIRS | `[-90.0000, 90.0000]` | Geodetic latitude of the center of the detecting pixel in WGS 84. | Preserved with 4 decimal places ($\approx 11\text{ m}$ precision). |
| `longitude` | `float64` | MODIS, VIIRS | `[-180.0000, 180.0000]` | Geodetic longitude of the center of the detecting pixel in WGS 84. | Preserved with 4 decimal places. |
| `acq_date` | `ISO date` | MODIS, VIIRS | `YYYY-MM-DD` | Coordinated Universal Time (UTC) date of satellite overpass acquisition. | Standardized to ISO 8601 string. |
| `acq_time` | `string(4)` | MODIS, VIIRS | `0000` to `2359` | UTC acquisition time in HHMM format. | Preserved as 4-character zero-padded string. Used in time delta $\Delta t$ collocation check. |
| `satellite` | `string` | MODIS, VIIRS | `TERRA`, `AQUA`, `SNPP`, `NOAA20`, `NOAA21` | Spacecraft hosting the detecting instrument. | Upper-case string. Governs mission launch boundary checks. |
| `sensor` | `string` | MODIS, VIIRS | `MODIS`, `VIIRS` | Family of the optical/radiometric instrument. | Governs pixel footprint calculations ($1000\text{ m}$ vs $375\text{ m}$) and scaling coefficients $\alpha(m)$. |
| `confidence_raw` | `string` | MODIS, VIIRS | MODIS: `0`–`100`<br>VIIRS: `l`, `n`, `h` | Native detection confidence reported by the active fire algorithm. | **Preserved exactly as delivered by NASA.** Never overwritten or mutated. |
| `confidence_norm`| `int32` | Derived | `0` to `100` | Standardized detection confidence indicator. | MODIS: numerical value mapped directly.<br>VIIRS: `low (l)` $\to 30$, `nominal (n)` $\to 60$, `high (h)` $\to 90$. |
| `frp` | `float64` | MODIS, VIIRS | `[0.0, 10000.0]` MW | Fire Radiative Power: instantaneous rate of radiative energy release in MegaWatts. | Preserved in MegaWatts. Computed from $4\,\mu\text{m}$ radiances. Tracked independently per sensor due to different sub-pixel saturation thresholds. |
| `brightness` | `float64` | MODIS, VIIRS | `[250.0, 500.0]` K | Brightness temperature of the fire pixel in mid-infrared channel ($4\,\mu\text{m}$, MODIS Ch 21/22 or VIIRS I4 band). | Measured in Kelvin. Key indicator of combustion intensity. |
| `brightness_temp`| `float64` | MODIS, VIIRS | `[200.0, 400.0]` K | Brightness temperature in thermal infrared channel ($11\,\mu\text{m}$, MODIS Ch 31 or VIIRS I5 band). | Used in background temperature differentiation and cloud/water screening. |
| `daynight` | `string(1)` | MODIS, VIIRS | `D`, `N` | Solar illumination indicator at detection location. | `D` = Day pass, `N` = Night pass. Critical for solar reflection filtering. |
| `scan` | `float64` | MODIS, VIIRS | MODIS: $1.0$–$4.8\text{ km}$<br>VIIRS: $0.375$–$0.8\text{ km}$ | Along-scan pixel spatial resolution at the observed viewing angle. | Preserved. Accounts for geometric pixel expansion towards scan swath edges ("bow-tie effect"). |
| `track` | `float64` | MODIS, VIIRS | MODIS: $1.0$–$2.0\text{ km}$<br>VIIRS: $0.375$–$0.6\text{ km}$ | Along-track pixel spatial resolution at the observed viewing angle. | Preserved. |
| `processing_type`| `string` | MODIS, VIIRS | `NRT`, `SP` | Ingestion pipeline processing tier. | `NRT` = Near Real-Time (expedited, provisional calibration).<br>`SP` = Standard Processing (science-quality historical archive). |
| `source_product` | `string` | MODIS, VIIRS | E.g. `MODIS_NRT`, `VIIRS_SNPP_SP` | NASA FIRMS product distribution code. | Preserved for scientific reproducibility and provenance. |
| `is_collocated` | `boolean` | Derived | `true`, `false` | Cross-sensor spatial-temporal collocation flag. | `true` if collocated with another sensor pass within $\Delta d \le 1.0\text{ km}$ and $\Delta t \le 30\text{ min}$. **Records are never dropped.** |
| `version` | `string` | MODIS, VIIRS | `6.1`, `2.0` | NASA science algorithm collection version. | MODIS: Collection 6.1.<br>VIIRS: Collection 2.0. |
| `ingestion_timestamp`| `ISO string`| System | UTC timestamp | System ingestion timestamp. | Audit trail for tracking data freshness. |

---

## 3. Four Core Analytical Metrics Formulation

### Metric 1: Raw Hotspot Count ($N_{\text{raw}}$)
- **Definition:** The unweighted, unscaled total number of distinct thermal anomaly pixels detected by one or more satellites within an AOI over a defined time interval.
- **Reporting:** Always stratified by satellite (`TERRA`, `AQUA`, `SNPP`, `NOAA-20`, `NOAA-21`) and sensor family (`MODIS`, `VIIRS`).
- **Interpretation Rule:** A raw hotspot count is an **instantaneous thermal detection**, NOT a confirmed wildfire incident or a polygon of burned area.

### Metric 2: Harmonized Hotspot Density Index (HDI)
- **Definition:** An area-normalized, cross-calibrated burning activity index expressing continuous burning density across multi-decadal timelines:
  $$\text{HDI} = \frac{N_{\text{MODIS}} + \alpha(m) \cdot N_{\text{VIIRS}}}{A_{\text{cell}}} \times 1000$$
  where $A_{\text{cell}} = 100\text{ km}^2$ on the equal-area sinusoidal grid and $\alpha(m) \in [0.33, 0.38]$ is the empirical monthly calibration factor.
- **Reporting Units:** Equivalent MODIS Hotspots per $1000\text{ km}^2$ per month (or day).
- **Interpretation Rule:** Provides an inter-sensor consistent historical burning activity metric across the 2000–present continuum.

### Metric 3: Fire Radiative Power (FRP)
- **Definition:** Rate of radiative energy release from actively burning combustion at the moment of observation:
  $$\text{FRP} = \frac{\sigma \cdot \epsilon \cdot A_{\text{fire}} \cdot T^4}{\ldots} \quad (\text{MW})$$
- **Reporting:** Mean FRP, Maximum FRP, and Total Radiative Energy by sensor.
- **Interpretation Rule:** FRP measurements from MODIS ($1\text{ km}$) and VIIRS ($375\text{ m}$) have different sub-pixel saturation thresholds and should be analyzed sensor-by-sensor or with distribution percentiles.

### Metric 4: Detection Coverage & Completeness
- **Definition:** Quantitative status of satellite observation coverage over a temporal interval.
- **Categorization:**
  - `ACTIVE_OBSERVATIONS`: Hotspots detected during operational overpasses.
  - `ZERO_HOTSPOTS_OBSERVED`: Satellite completed valid orbital passes over the AOI with zero thermal anomalies detected.
  - `NO_DATA_PRE_LAUNCH`: Pre-launch period (e.g. Terra before 2000, Aqua before 2002, VIIRS before 2012).
  - `MISSING_TELEMETRY`: Ingestion error, orbital cloud obscuration, or maintenance downtime.
- **Interpretation Rule:** Zero fires observed must never be confused with absent telemetry or missing satellite passes.

