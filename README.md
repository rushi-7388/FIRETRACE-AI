# 🔥 FireTrace AI

**NASA Space Apps Challenge 2026 — Surat Region**  
**Challenge: Harmonization of MODIS and VIIRS Hot Spots**

> A web application that harmonizes MODIS and VIIRS satellite fire hotspot data into a unified burning activity calendar — enabling emergency managers, scientists, and land managers to visualize fire history, detect anomalies, and monitor critical regions.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- NASA FIRMS API Key (free at https://firms.modaps.eosdis.nasa.gov/api/register/)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your FIRMS_API_KEY to .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🔬 How It Works

### The Harmonization Problem
MODIS (1 km resolution, 2000–present) and VIIRS (375 m resolution, 2012–present) cannot be directly compared:
- VIIRS detects 3–5× more hotspots for the same fire due to finer spatial resolution
- Different satellite overpasses mean different temporal sampling
- Direct count comparison creates misleading trends

### Our Solution: Hotspot Density Index (HDI)
1. **Spatial normalization** — both sensors aggregated to 0.25° grid cells
2. **Sensor correction factors** — derived from the 2012–2022 overlap period
3. **Temporal normalization** — hotspot density per km² per month
4. **Anomaly detection** — Z-score vs historical median per calendar month

### Result
A single consistent metric from 2000 to present, enabling:
- Identification of seasonal fire patterns
- Year-to-year comparison
- Anomaly detection (which months/years were unusually active)

---

## 📊 Features
- 🗺️ **Interactive Map** — draw area of interest, view hotspot locations
- 📅 **Burning Activity Calendar** — 25-year month×year heatmap
- 📈 **Time Series** — MODIS vs VIIRS vs Harmonized trend lines
- 🔴 **Anomaly Detection** — Z-score visualization per month
- 📥 **CSV Export** — download harmonized data
- 🌍 **Region Presets** — Surat, Ahmedabad, Mumbai, Amazon, Australia

---

## 📡 Data Sources
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — Fire Information for Resource Management System
  - MODIS Collection 6.1
  - VIIRS S-NPP (Suomi National Polar-orbiting Partnership)
  - VIIRS NOAA-20

---

## 🏗️ Architecture
```
frontend/   React 18 + Vite + Tailwind + Leaflet + D3 + Recharts
backend/    FastAPI + pandas + numpy + scipy
```

---

## 👥 Team
NASA Space Apps Challenge 2026 — Surat Region

---

*Built with ❤️ for the NASA Space Apps Challenge 2026*

# FIRETRACE-AI
