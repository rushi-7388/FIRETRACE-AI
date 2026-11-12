# FIRETRACE AI - Deployment & Local Operations Guide

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Document Reference:** FIRETRACE-DEPLOY-V2.0  

---

## 1. Quick Local Start (Windows)

The repository provides a one-click startup script:
```powershell
.\start.bat
```
This automatically launches:
- **FastAPI Scientific Backend:** Running on `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).
- **React + Vite Frontend:** Running on `http://localhost:5173`.

---

## 2. Manual Development Setup

### Backend Setup:
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```

---

## 3. Docker Container Deployment

FIRETRACE AI includes production containerization via `docker-compose.yml`:
```powershell
docker-compose up --build
```
- Multi-stage build compiles the React static bundle and serves it via Nginx or FastAPI static files.
- Mounts persistent caching at `/app/cache` and SQLite/PostgreSQL volume.

---

## 4. Environment Variables Configuration

Create a `.env` file in the project root:
```ini
# Optional NASA FIRMS MAP_KEY (If left blank, physics-calibrated synthetic engine activates)
NASA_MAP_KEY=your_nasa_firms_key_here

# Local Cache & Database paths
CACHE_DIR=./cache
DATABASE_PATH=./firetrace.db
```

