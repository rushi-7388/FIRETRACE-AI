"""
FIRETRACE-AI — FastAPI Backend
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
    yield
    print("[FIRETRACE-AI] Shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="FIRETRACE-AI API",
    description=(
        "NASA Space Apps 2026 — Harmonizes MODIS and VIIRS satellite fire "
        "hotspot data into a unified Hotspot Density Index (HDI) with "
        "temporal anomaly detection."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for hackathon / demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from routes.hotspots import router as hotspots_router   # noqa: E402
from routes.harmonize import router as harmonize_router  # noqa: E402
from routes.export import router as export_router        # noqa: E402

app.include_router(hotspots_router, prefix="/api")
app.include_router(harmonize_router, prefix="/api")
app.include_router(export_router, prefix="/api")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/", tags=["info"])
async def root():
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
            "hotspots": "GET  /api/hotspots  — Raw GeoJSON hotspot features",
            "harmonize": "POST /api/harmonize — Full harmonization pipeline",
            "calendar": "GET  /api/calendar  — Calendar matrix + monthly stats",
            "export_csv": "POST /api/export/csv — Download harmonized CSV",
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
