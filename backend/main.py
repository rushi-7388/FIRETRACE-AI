"""
FIRETRACE-AI - FastAPI Backend
NASA Space Apps 2026

Harmonizes MODIS and VIIRS satellite fire hotspot data to deliver
a unified Hotspot Density Index (HDI) with temporal anomaly detection.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db_manager import init_database, get_ingestion_logs, get_db_connection
from fastapi.encoders import ENCODERS_BY_TYPE
import numpy as np

# Register NumPy scalar and array encoders to guarantee flawless JSON serialization
ENCODERS_BY_TYPE[np.bool_] = bool
ENCODERS_BY_TYPE[np.integer] = int
ENCODERS_BY_TYPE[np.floating] = float
ENCODERS_BY_TYPE[np.ndarray] = lambda arr: arr.tolist()

load_dotenv()

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle handler."""
    cache_dir = os.getenv("CACHE_DIR", "./cache")
    os.makedirs(cache_dir, exist_ok=True)
    print(f"[FIRETRACE-AI] Cache directory ready → {os.path.abspath(cache_dir)}")
    try:
        init_database()
        print("[FIRETRACE-AI] Database & provenance schema initialized.")
    except Exception as exc:
        print(f"[FIRETRACE-AI] DB init warning: {exc}")
    yield
    print("[FIRETRACE-AI] Shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="FIRETRACE-AI API",
    description=(
        "NASA Space Apps 2026 - Harmonizes MODIS and VIIRS satellite fire "
        "hotspot data into a unified Hotspot Density Index (HDI) with "
        "temporal anomaly detection."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow all origins for hackathon / demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global 24/7 Resilient Exception Handler
# ---------------------------------------------------------------------------
import uuid
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Intercept any unexpected exception, log it, and return a clean JSON response."""
    error_id = str(uuid.uuid4())[:8]
    print(f"[FIRETRACE-AI GUARD] Intercepted Error {error_id} on {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_id": error_id,
            "message": "Satellite harmonization pipeline caught an internal state. System remains fully operational.",
            "detail": str(exc),
            "path": request.url.path,
        },
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from routes.hotspots import router as hotspots_router   # noqa: E402
from routes.harmonize import router as harmonize_router  # noqa: E402
from routes.export import router as export_router        # noqa: E402
from routes.analytics_ml import router as ml_router      # noqa: E402

app.include_router(hotspots_router, prefix="/api")
app.include_router(harmonize_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(ml_router, prefix="/api")


@app.get("/api/provenance", tags=["provenance"])
def get_provenance():
    """Retrieve data provenance, registered satellite configurations, and ingestion audit logs."""
    logs = get_ingestion_logs()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM satellites")
    satellites = [dict(r) for r in cur.fetchall()]
    cur.execute("SELECT * FROM sensors")
    sensors = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {
        "status": "operational",
        "nasa_firms_key_configured": bool(os.getenv("NASA_MAP_KEY") or os.getenv("FIRMS_API_KEY")),
        "satellites": satellites,
        "sensors": sensors,
        "recent_ingestion_logs": logs,
    }


@app.get("/api/status", tags=["info"])
def get_system_status():
    """System health check & NASA FIRMS connection status."""
    has_key = bool(os.getenv("NASA_MAP_KEY") or os.getenv("FIRMS_API_KEY"))
    return {
        "status": "online",
        "service": "FIRETRACE-AI",
        "version": "1.0.0",
        "nasa_firms_mode": "LIVE_DIRECT_INGESTION" if has_key else "STANDALONE_SYNTHETIC_CALIBRATED",
        "capabilities": [
            "MODIS_VIIRS_HARMONIZATION",
            "10KM_EQUAL_AREA_SINUSOIDAL_GRID",
            "HOTSPOT_DENSITY_INDEX",
            "FRP_CALIBRATION",
            "Z_SCORE_ANOMALY_DETECTION",
            "EXECUTIVE_PDF_EXPORT",
        ],
    }


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/", tags=["info"])
def root():
    """API information and available endpoints."""
    return {
        "project": "FIRETRACE-AI",
        "event": "NASA Space Apps 2026",
        "description": (
            "Harmonizes MODIS and VIIRS satellite fire hotspot data into a "
            "unified Hotspot Density Index (HDI) with temporal anomaly "
            "detection and calendar visualization."
        ),
        "version": "1.0.0",
        "endpoints": {
            "hotspots": "GET  /api/hotspots  - Raw GeoJSON hotspot features",
            "harmonize": "POST /api/harmonize - Full harmonization pipeline",
            "calendar": "GET  /api/calendar  - Calendar matrix + monthly stats",
            "export_csv": "POST /api/export/csv - Download harmonized CSV",
        },
        "docs": "/docs",
        "redoc": "/redoc",
    }


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
