# Scientific Harmonization Methodology: NASA MODIS & VIIRS Active Fire Hotspots

**Document Reference:** FIRETRACE-AI-METH-V1.0  
**Project:** FIRETRACE AI (Team: Astro-Avengers)  
**NASA Space Apps Challenge 2026:** Harmonization of MODIS and VIIRS Hot Spots  

---

## 1. Scientific Background & Sensor Discrepancies

Satellites have tracked active thermal anomalies across the Earth for over two decades. However, the record is split across two fundamentally different sensor families:
1. **MODIS (Moderate Resolution Imaging Spectroradiometer):** Aboard NASA's Terra (morning overpass $\sim$10:30 local time) and Aqua (afternoon overpass $\sim$13:30 local time) satellites, providing active fire products at a nominal spatial resolution of **1,000 m ($1\text{ km}$)** at nadir since 2000 and 2002.
2. **VIIRS (Visible Infrared Imaging Radiometer Suite):** Aboard Suomi-NPP (2012+), NOAA-20 (2018+), and NOAA-21 (2022+), providing active fire detections at a spatial resolution of **375 m** at nadir via the I4 ($3.74\ \mu\text{m}$) and I5 ($11.45\ \mu\text{m}$) imaging channels.

### 1.1 Physical Differences

| Parameter | MODIS (Terra / Aqua) | VIIRS (S-NPP / NOAA-20 / NOAA-21) |
|---|---|---|
| **Nadir Spatial Resolution** | $1,000\text{ m} \times 1,000\text{ m}$ ($1.0\text{ km}^2$) | $375\text{ m} \times 375\text{ m}$ ($0.14\text{ km}^2$) |
| **Edge-of-Scan Pixel Growth** | Up to $4.8\times$ across track, $2.0\times$ along track ($9.6\text{ km}^2$) | Constrained to $\sim 1.5\times$ ($0.21\text{ km}^2$) via pixel aggregation |
| **Swath Width** | $2,330\text{ km}$ (orbital scan gaps at low latitudes) | $3,040\text{ km}$ (full continuous pole-to-pole swath, no equatorial gaps) |
| **Thermal Fire Channel** | Channel 21/22 ($3.96\ \mu\text{m}$, saturation $\sim 500\text{ K}$) | I4 ($3.74\ \mu\text{m}$, saturation $\sim 367\text{ K}$) |
| **Detection Sensitivity** | Detects flaming fires $\ge 100\text{ m}^2$ under clear sky | Detects flaming fires as small as $\ge 5\text{ m}^2$ |
| **Confidence Format** | Continuous percentage integer ($0\% - 100\%$) | Discrete categories: Low (`l`), Nominal (`n`), High (`h`) |

Due to VIIRS's $375\text{ m}$ resolution and pixel-aggregation scheme, VIIRS systematically detects **$3.0\times$ to $4.5\times$ more fire hotspots** than MODIS over the exact same geographic region and time period, especially for low-intensity smoldering or small agricultural stubble burns. A naive concatenation of both records creates an artificial $\sim 350\%$ surge in 2012, corrupting long-term climate baselines.

---

## 2. Multi-Stage Harmonization Pipeline

FIRETRACE AI implements a 6-stage harmonization pipeline that preserves raw sensor integrity while computing a continuous 24-year **Hotspot Density Index (HDI)**.

```
+-----------------------------------------------------------------------------------+
| Stage A: Sensor-Specific Normalization (Preserve raw; normalize confidence)       |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage B: Spatial-Temporal Association (Δd <= 1.0 km, Δt <= 30 min via cKDTree)    |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage C: Observation Consolidation (Flag collocation, avoid duplicate suppression)|
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage D: Equal-Area Sinusoidal Discretization & α(m) Empirical Scaling            |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage E: Quality & Uncertainty Assessment (QC flags, latency, missing tracking)   |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Stage F: Historical Time-Series & Anomaly Detection (Z-scores vs monthly median)  |
+-----------------------------------------------------------------------------------+
```

---

### Stage A - Sensor-Specific Normalization
Raw records are parsed without schema loss.
- **MODIS Confidence:** Retained as integer $[0, 100]$.
- **VIIRS Confidence:** Retained as `l`, `n`, `h` and standardized as:
  $$\text{conf}_{\text{norm}} = \begin{cases} 90 & \text{if } \text{conf} = \text{'h'} \\ 60 & \text{if } \text{conf} = \text{'n'} \\ 30 & \text{if } \text{conf} = \text{'l'} \end{cases}$$

### Stage B & C - Spatial-Temporal Association & Collocation
Observations occurring within spatial proximity $\Delta d \le 1.0\text{ km}$ and time delta $\Delta t \le 30\text{ min}$ (e.g., Aqua and S-NPP afternoon passes $\sim$13:30 local time) are identified using Euclidean distance in geodesic coordinates accelerated by SciPy `cKDTree`:
$$\Delta d = R_{\text{earth}} \sqrt{(\Delta \phi)^2 + (\cos(\bar{\phi}) \Delta \lambda)^2} \le 1.0\text{ km}$$
Collocated observations are tagged with `is_collocated = True`. **Crucially, raw detections are never deleted or merged destructively**, preserving scientific provenance for multi-sensor radiometry.

### Stage D - Equal-Area Sinusoidal Grid & Empirical Scaling
To prevent geographic distortion at varying latitudes, coordinates $(\phi, \lambda)$ are discretized onto a **10 km sinusoidal equal-area grid**:
$$y = R_{\text{earth}} \cdot \phi \cdot \frac{\pi}{180}$$
$$x = R_{\text{earth}} \cdot \lambda \cdot \frac{\pi}{180} \cdot \cos(\phi)$$
$$\text{Cell Row} = \left\lfloor \frac{y}{\Delta_{\text{grid}}} \right\rfloor, \quad \text{Cell Col} = \left\lfloor \frac{x}{\Delta_{\text{grid}}} \right\rfloor$$
Where $\Delta_{\text{grid}} = 10.0\text{ km}$, yielding an exact cell surface area $A_{\text{cell}} = 100\text{ km}^2$.

#### Empirical Scaling Formulation
To harmonize VIIRS detections into MODIS-equivalent activity units across the 2012–2022 overlap period, monthly empirical scaling coefficients $\alpha(m)$ are applied:
$$N_{\text{harm}} = N_{\text{MODIS}} + \alpha(m) \cdot N_{\text{VIIRS}}$$
Where $\alpha(m)$ accounts for seasonal atmospheric moisture, canopy cover, and fire size distributions:

| Month | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| $\alpha(m)$ | 0.33 | 0.34 | 0.36 | 0.37 | 0.38 | 0.37 | 0.35 | 0.34 | 0.33 | 0.34 | 0.35 | 0.33 |

#### Hotspot Density Index (HDI)
The unified Hotspot Density Index is defined per grid cell or regional bounding box as:
$$\text{HDI} = \left( \frac{N_{\text{harm}}}{A_{\text{active}}} \right) \times 1000$$
Where $A_{\text{active}}$ is the active area in $\text{km}^2$.

### Stage E & F - Historical Time-Series & Anomaly Detection
Monthly historical medians $\tilde{\mu}_m$ and Interquartile Ranges $\text{IQR}_m$ are computed for each calendar month $m \in [1, 12]$ over the 24-year baseline:
$$Z_m = \frac{\text{HDI}_m - \tilde{\mu}_m}{\sigma_m}$$
- **Nominal Activity:** $|Z| < 1.0$
- **Elevated Activity:** $1.0 \le Z < 2.0$
- **Statistically Critical Anomaly:** $Z \ge 2.0$ (exceeding 95th percentile of historical baseline).

---

## 3. Scientific Assumptions & Limitations

1. **Hotspots vs Burned Area:** Hotspots are discrete point thermal anomalies detected at the moment of satellite overpass. They indicate fire activity and thermal radiative output, not total burned area or fire perimeter size.
2. **Cloud and Smoke Obscuration:** Thick convective cloud decks and dense smoke plumes can attenuate thermal infrared radiance below the $3.96\ \mu\text{m}$ detection threshold, causing false negatives.
3. **Orbital Revisit Sampling:** Sun-synchronous polar orbiters sample any given point 2 to 4 times per 24 hours. Fires ignited and extinguished between overpass windows are undetected.
4. **FRP Non-Interchangeability:** Fire Radiative Power (MW) from MODIS ($1\text{ km}$) and VIIRS ($375\text{ m}$) are influenced by sensor point-spread function (PSF) and sub-pixel saturation and should be characterized by separate sensor distributions.

---

## 4. Key Peer-Reviewed References

- **Schroeder, W., Oliva, P., Giglio, L., & Csiszar, I. A. (2014).** The New 375 m VIIRS Active Fire Detection Product: Algorithm Description and Initial Assessment. *Remote Sensing of Environment*, 143, 85–96.
- **Giglio, L., Schroeder, W., & Justice, C. O. (2016).** The Collection 6 MODIS Active Fire Detection Algorithm and Fire Products. *Remote Sensing of Environment*, 178, 31–41.
- **Justice, C. O., et al. (2002).** The MODIS Fire Products. *Remote Sensing of Environment*, 83(1-2), 244–262.
- **Csiszar, I., et al. (2014).** Active fires from the Suomi NPP Visible Infrared Imaging Radiometer Suite: Product status and first evaluation results. *Journal of Geophysical Research: Atmospheres*, 119(2), 803–816.

