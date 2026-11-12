# FIRETRACE AI - Advanced AI/ML & Statistical Intelligence Methodology

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Challenge:** Harmonization of MODIS and VIIRS Active Fire Hotspots  
**Team:** Astro-Avengers  
**Document Version:** 2.0 (Scientific AI/ML Specifications, Algorithms & Validation Rules)

---

## 1. Executive Scientific Stance on AI in Earth Observation

In accordance with NASA Earth Science Division directives, **AI and Machine Learning within FIRETRACE AI serve as deterministic analytical and pattern-recognition augmentations - never as opaque replacements for physical radiative transfer observations or empirical calibrations.**

Key principles:
1. **Zero Hallucination:** Numerical answers to fire analytics queries are calculated directly from verified data structures using pure deterministic math, never invented by a large language model.
2. **Explicit Uncertainty:** Every predictive model (such as experimental time-series forecasting) includes backtested error metrics (MAE, RMSE, MAPE) and 80%/95% confidence intervals.
3. **Transparent Methodology:** All algorithms use peer-reviewed mathematical formulations (DBSCAN, Mann-Kendall, Sen's slope, seasonal decomposition).

---

## 2. Machine Learning & Statistical Modules

### Module 1: Spatial-Temporal Hotspot Clustering & Evolution (Haversine DBSCAN)

- **Purpose:** Identifies spatial concentrations of fire detections without assuming spherical geometry or pre-defined cluster counts.
- **Algorithm:** Density-Based Spatial Clustering of Applications with Noise (DBSCAN) using the spherical **Haversine metric**.
- **Mathematical Formulation:**
  For any two points $p_1 = (\phi_1, \lambda_1)$ and $p_2 = (\phi_2, \lambda_2)$ in radians:
  $$d_{\text{hav}}(p_1, p_2) = 2 R \arcsin \left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Default Hyperparameters:**
  - $\epsilon_{\text{km}} = 12.0\text{ km}$ ($\approx 0.00188$ radians): Accounts for regional fire cluster perimeters and agricultural burn complexes.
  - $\text{MinPts} = 3$: Prevents isolated single-point sensor noise from creating false clusters.
- **Cluster Evolution Metrics:**
  - **Centroid:** Weighted geographical center $(\bar{\phi}, \bar{\lambda})$.
  - **Bounding Envelope:** $[\min\lambda, \min\phi, \max\lambda, \max\phi]$.
  - **Temporal Duration:** $\Delta t_{\text{days}} = \text{Date}_{\text{last}} - \text{Date}_{\text{first}} + 1$.
  - **Persistence Categorization:**
    - `Persistent Multi-Day Burning`: Duration $\ge 3\text{ days}$.
    - `Multi-Pass Event`: Duration $= 2\text{ days}$.
    - `Single-Day Incident`: Duration $= 1\text{ day}$.
- **Important Scientific Guardrail:** Clustering groups detections that occur in close proximity; it **does NOT represent physical continuous fire-front propagation**.

---

### Module 2: Non-Parametric Regime Change & Trend Detection (Mann-Kendall & Sen's Slope)

- **Purpose:** Tests whether annual burning activity in a region exhibits a statistically significant monotonic increasing or decreasing trend over 24+ years, robust to sensor transitions and non-normal distributions.
- **Mann-Kendall Test Statistic ($S$):**
  $$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^n \text{sgn}(x_j - x_k)$$
  where $\text{sgn}(\theta) = +1$ if $\theta > 0$, $0$ if $\theta = 0$, and $-1$ if $\theta < 0$.
- **Variance of $S$:**
  $$\text{Var}(S) = \frac{n(n - 1)(2n + 5) - \sum_{t} t(t - 1)(2t + 5)}{18}$$
- **Standardized Test Statistic ($Z$):**
  $$Z = \begin{cases} \frac{S - 1}{\sqrt{\text{Var}(S)}} & \text{if } S > 0 \\ 0 & \text{if } S = 0 \\ \frac{S + 1}{\sqrt{\text{Var}(S)}} & \text{if } S < 0 \end{cases}$$
- **$p$-Value Evaluation:** Derived from standard normal cumulative distribution $p = 2(1 - \Phi(|Z|))$. Evaluated at $\alpha = 0.05$ significance level.
- **Sen's Non-Parametric Median Slope ($Q$):**
  $$Q = \text{Median} \left\{ \frac{x_j - x_k}{j - k} \quad \forall \; 1 \le k < j \le n \right\}$$
  Provides the robust decadal rate of change ($\Delta\text{HDI}/\text{year}$) immune to extreme outlier fire years.

---

### Module 3: Experimental Fire Activity Forecasting (Seasonal Auto-Regressive)

- **Purpose:** Generates 1 to 12-month forward-looking projections of monthly burning activity for land managers and fire season preparation.
- **Methodology:**
  Decomposes historical monthly HDI time series into:
  $$\text{HDI}_t = T_t + S_t + R_t$$
  - **Seasonal Baseline ($S_t$):** Monthly historical climatology vector (12-month median profile).
  - **Trend ($T_t$):** Linear Sen's slope component.
  - **Autoregressive Residual ($R_t$):** $AR(1)$ process on recent seasonal departures:
    $$R_t = \phi_1 R_{t-1} + \epsilon_t, \quad |\phi_1| < 1$$
- **Rigorous Holdout Backtesting:**
  - Evaluated on the most recent 12 months held out as an unobserved test set.
  - **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{n} \sum |y_i - \hat{y}_i|$.
  - **Root Mean Squared Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$.
  - **Mean Absolute Percentage Error (MAPE):** $\text{MAPE} = \frac{100\%}{n} \sum \left|\frac{y_i - \hat{y}_i}{y_i}\right|$.
- **Confidence Intervals:** 80% ($Z = 1.28$) and 95% ($Z = 1.96$) forecast intervals expanding with horizon $\sqrt{h}$.
- **Mandatory User Disclaimer:** This model forecasts **regional burning activity levels** based on historical climatology. It does **NOT predict the exact geographical ignition location or spread of individual wildfires**.

---

### Module 4: Global Burning Fingerprint & Biome Similarity Matching

- **Purpose:** Characterizes any AOI's annual burning regime as a 12-dimensional normalized unit vector and matches it against reference Earth biomes.
- **Vector Formulation:**
  For an AOI's monthly median HDI values $M = [m_1, m_2, \ldots, m_{12}]$:
  $$v_i = \frac{m_i}{\sum_{k=1}^{12} m_k}, \quad \sum_{i=1}^{12} v_i = 1.0$$
- **Similarity Metric (Cosine Similarity):**
  $$\text{Sim}(v_{\text{AOI}}, v_{\text{Biome}}) = \frac{v_{\text{AOI}} \cdot v_{\text{Biome}}}{\|v_{\text{AOI}}\|_2 \, \|v_{\text{Biome}}\|_2}$$
- **Reference Biome Library:**
  1. *Indian Subcontinent (Agricultural & Forest Fire Cycle):* Bimodal peak (March–May pre-monsoon, Oct–Nov post-monsoon crop residue).
  2. *Amazon Basin (Tropical Rainforest & Deforestation):* Dry season peak in August–October.
  3. *Mediterranean Basin & Southern Europe:* Summer peak in July–August.
  4. *Australian Savanna & Bushland:* Spring/summer peak in November–January.
  5. *Boreal Taiga (Siberia / Canada):* Early summer peak in June–July.

---

### Module 5: What-Changed Period-over-Period Differential Intelligence

- **Purpose:** Automatically isolates structural burning shifts between two user-selected multi-year periods (e.g. Period A: 2015–2018 vs Period B: 2019–2022).
- **Computed Indicators:**
  - **Observation Count Shift:** $\Delta N = N_B - N_A$ and $\% \Delta = \frac{N_B - N_A}{N_A} \times 100\%$.
  - **FRP Radiative Intensity Shift:** $\Delta\text{FRP} = \text{Mean}(\text{FRP}_B) - \text{Mean}(\text{FRP}_A)$.
  - **Spatial Centroid Displacement:** Great-circle distance between spatial centroids $(\bar{\phi}_A, \bar{\lambda}_A)$ and $(\bar{\phi}_B, \bar{\lambda}_B)$ in kilometers.
  - **Sensor Contribution Distribution:** Checks whether increases were driven by VIIRS adoption or authentic physical activity increases.

---

### Module 6: Deterministic Natural Language Assistant

- **Purpose:** Answers user queries in natural language through direct analytical interrogation of backend data arrays without generative hallucinations.
- **Supported Query Intents:**
  1. `PEAK_MONTH`: Scans monthly aggregated series and identifies peak activity month, year, and value.
  2. `HISTORICAL_COMPARISON`: Compares current period HDI against multi-decadal median and computes standardized Z-Score.
  3. `SENSOR_DIFFERENCE`: Explains the physical differences between MODIS (1000m) and VIIRS (375m) and details the $\alpha(m)$ scaling factor.
  4. `TREND_ANALYSIS`: Reports the Mann-Kendall trend, $p$-value, and Sen's decadal rate of change.
  5. `ANOMALY_STATUS`: Enumerates detected anomalous months and explainable seasonal drivers.

