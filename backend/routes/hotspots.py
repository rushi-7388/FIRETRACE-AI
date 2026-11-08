"""
routes/hotspots.py
==================
GET /api/hotspots - Raw GeoJSON FeatureCollection of fire hotspot points.

Query parameters
----------------
bbox        : str  - "min_lon,min_lat,max_lon,max_lat"  (default: global)
start_date  : str  - YYYY-MM-DD  (default: 7 days ago)
end_date    : str  - YYYY-MM-DD  (default: today)
sensor      : str  - "modis" | "viirs" | "both"  (default: "both")
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from services.firms_client import fetch_modis, fetch_viirs

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hotspots"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DEFAULT_BBOX = (-180.0, -90.0, 180.0, 90.0)  # (min_lon, min_lat, max_lon, max_lat)


def _parse_bbox(bbox: Optional[str]) -> tuple[float, float, float, float]:
    """
    Parse a "min_lon,min_lat,max_lon,max_lat" string.
    Returns (min_lon, min_lat, max_lon, max_lat).
    """
    if bbox is None:
        return _DEFAULT_BBOX
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(
            status_code=422,
            detail="bbox must be 'min_lon,min_lat,max_lon,max_lat'",
        )
    try:
        min_lon, min_lat, max_lon, max_lat = map(float, parts)
    except ValueError:
        raise HTTPException(status_code=422, detail="bbox values must be numeric.")

    if min_lon >= max_lon or min_lat >= max_lat:
        raise HTTPException(
            status_code=422,
            detail="bbox min values must be less than max values.",
        )
    return min_lon, min_lat, max_lon, max_lat


def _df_to_geojson(df: pd.DataFrame) -> dict:
    """Convert a hotspot DataFrame to a GeoJSON FeatureCollection."""
    features = []
    required_props = ["acq_date", "acq_time", "frp", "confidence", "brightness", "sensor"]

    for _, row in df.iterrows():
        try:
            lon = float(row["longitude"])
            lat = float(row["latitude"])
        except (KeyError, ValueError, TypeError):
            continue

        props: dict = {}
        for col in required_props:
            val = row.get(col)
            if pd.isna(val) if not isinstance(val, str) else False:
                props[col] = None
            else:
                # Serialise date objects as strings
                if hasattr(val, "isoformat"):
                    props[col] = val.isoformat()
                elif hasattr(val, "item"):  # numpy scalar
                    props[col] = val.item()
                else:
                    props[col] = val

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, 5), round(lat, 5)],
            },
            "properties": props,
        }
        features.append(feature)

    hotspot_list = []
    for i, f in enumerate(features):
        props = f["properties"]
        coords = f["geometry"]["coordinates"]
        hotspot_list.append({
            "id": i,
            "lat": coords[1],
            "lon": coords[0],
            "frp": props.get("frp") or 10.0,
            "date": props.get("acq_date") or "",
            "sensor": props.get("sensor") or "MODIS",
            "confidence": props.get("confidence") or "nominal",
        })

    return {
        "type": "FeatureCollection",
        "features": features,
        "hotspots": hotspot_list,
        "meta": {
            "count": len(features),
        },
    }


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.get("/hotspots", summary="Raw GeoJSON hotspot features")
async def get_hotspots(
    bbox: Optional[str] = Query(
        default=None,
        description="Bounding box as 'min_lon,min_lat,max_lon,max_lat'",
        examples=["-120,30,-100,50"],
    ),
    min_lon: Optional[float] = Query(default=None),
    min_lat: Optional[float] = Query(default=None),
    max_lon: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    start_date: Optional[str] = Query(
        default=None,
        description="Start date YYYY-MM-DD (default: 7 days ago)",
    ),
    end_date: Optional[str] = Query(
        default=None,
        description="End date YYYY-MM-DD (default: today)",
    ),
    sensor: str = Query(
        default="both",
        description="Sensor: 'modis', 'viirs', or 'both'",
    ),
    limit: Optional[int] = Query(default=500),
):
    """
    Return a GeoJSON FeatureCollection of raw fire hotspot detections.
    """
    # --- Parse bbox ---
    if min_lon is not None and min_lat is not None and max_lon is not None and max_lat is not None:
        p_min_lon, p_min_lat, p_max_lon, p_max_lat = min_lon, min_lat, max_lon, max_lat
    elif bbox:
        p_min_lon, p_min_lat, p_max_lon, p_max_lat = _parse_bbox(bbox)
    else:
        p_min_lon, p_min_lat, p_max_lon, p_max_lat = 72.0, 20.0, 74.5, 22.0

    # --- Parse dates ---
    today = date.today()
    try:
        sd = date.fromisoformat(start_date) if start_date else today - timedelta(days=7)
        ed = date.fromisoformat(end_date) if end_date else today
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid date format: {exc}")

    if sd > ed:
        raise HTTPException(status_code=422, detail="start_date must be ≤ end_date.")

    # Decide whether to use archive products (data older than ~3 months)
    cutoff = today - timedelta(days=90)
    use_archive = sd < cutoff

    # --- Fetch data ---
    frames: list[pd.DataFrame] = []

    if sensor in ("modis", "both"):
        modis_df = await fetch_modis(p_min_lat, p_min_lon, p_max_lat, p_max_lon, sd, ed, use_archive)
        if not modis_df.empty:
            frames.append(modis_df)

    if sensor in ("viirs", "both"):
        viirs_df = await fetch_viirs(p_min_lat, p_min_lon, p_max_lat, p_max_lon, sd, ed, use_archive=use_archive)
        if not viirs_df.empty:
            frames.append(viirs_df)

    if not frames:
        return {"type": "FeatureCollection", "features": [], "hotspots": [], "meta": {"count": 0}}

    combined = pd.concat(frames, ignore_index=True)

    # Filter rows that fall inside the bbox (defensive - FIRMS occasionally
    # returns a wider area than requested)
    combined = combined[
        (combined["latitude"] >= p_min_lat) & (combined["latitude"] <= p_max_lat) &
        (combined["longitude"] >= p_min_lon) & (combined["longitude"] <= p_max_lon)
    ]

    # Limit points according to limit query param
    max_pts = limit if limit and limit > 0 else 500
    if len(combined) > max_pts:
        combined = combined.sample(n=max_pts, random_state=42)

    logger.info(
        "Returning %d hotspots [sensor=%s, bbox=%s→%s, %s→%s]",
        len(combined), sensor, p_min_lon, p_max_lon, p_min_lat, p_max_lat,
    )

    return _df_to_geojson(combined)
