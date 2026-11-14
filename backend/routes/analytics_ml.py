"""
routes/analytics_ml.py
======================
FastAPI routes for Advanced AI/ML & Statistical Intelligence:
  - POST /api/ml/clusters
  - GET  /api/ml/forecast
  - GET  /api/ml/regime-change
  - GET  /api/ml/fingerprint
  - POST /api/analytics/compare-periods
  - POST /api/assistant/query
"""

from __future__ import annotations

import logging
import math
from datetime import date
from typing import Any, Dict, List, Optional
import numpy as np

from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import ENCODERS_BY_TYPE
from pydantic import BaseModel, Field

# Register NumPy types for robust JSON serialization
ENCODERS_BY_TYPE[np.bool_] = bool
ENCODERS_BY_TYPE[np.integer] = int
ENCODERS_BY_TYPE[np.floating] = float
ENCODERS_BY_TYPE[np.ndarray] = lambda arr: arr.tolist()


def _clean_nans(val: Any) -> Any:
    """Recursively replaces NaN, Infinity, -Infinity with 0.0 to guarantee JSON compliance."""
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return val
    elif isinstance(val, dict):
        return {k: _clean_nans(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [_clean_nans(v) for v in val]
    return val


def _normalize_date_str(d_str: Optional[str], is_end: bool = False, fallback: Optional[date] = None) -> date:
    if not d_str:
        return fallback or date.today()
    s = str(d_str).strip()
    if len(s) == 7:  # YYYY-MM
        s = f"{s}-28" if is_end else f"{s}-01"
    elif len(s) == 4:  # YYYY
        s = f"{s}-12-31" if is_end else f"{s}-01-01"
    try:
        return date.fromisoformat(s)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid date format: {exc}")

from services.firms_client import fetch_satellite_data
from services.harmonizer import harmonize_observations
from services.ml_engine import (
    detect_hotspot_clusters,
    calculate_mann_kendall_trend,
    forecast_fire_activity,
    compute_burning_fingerprint,
    compare_observation_periods,
    answer_fire_intelligence_query,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ai_ml_intelligence"])


class ClusterRequest(BaseModel):
    bbox: Optional[str] = "72.0,20.0,74.5,22.0"
    eps_km: float = 12.0
    min_samples: int = 3
    days_back: int = 30


class AssistantQueryRequest(BaseModel):
    query: str
    bbox: Optional[str] = "72.0,20.0,74.5,22.0"
    aoi_name: Optional[str] = "Selected AOI"


class ComparePeriodsRequest(BaseModel):
    bbox: str = "72.0,20.0,74.5,22.0"
    period_a_start: str = "2018-01-01"
    period_a_end: str = "2020-12-31"
    period_b_start: str = "2021-01-01"
    period_b_end: str = "2023-12-31"
    label_a: Optional[str] = "Baseline 2018-2020"
    label_b: Optional[str] = "Target 2021-2023"


def _parse_bbox(bbox_str: str) -> tuple[float, float, float, float]:
    parts = bbox_str.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=422, detail="bbox must be 'min_lon,min_lat,max_lon,max_lat'")
    return float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])


@router.post("/clusters", summary="DBSCAN Spatial Hotspot Clustering & Evolution")
async def post_clusters(req: ClusterRequest):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(req.bbox)
    today = date.today()
    sd = today - __import__("datetime").timedelta(days=req.days_back)

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, today)
    hotspots = []
    for _, row in raw_df.iterrows():
        hotspots.append({
            "lat": float(row["latitude"]),
            "lon": float(row["longitude"]),
            "frp": float(row.get("frp", 10.0)),
            "date": str(row.get("acq_date", today.isoformat())),
            "sensor": str(row.get("sensor", "MODIS")),
        })

    cluster_result = detect_hotspot_clusters(hotspots, eps_km=req.eps_km, min_samples=req.min_samples)
    return cluster_result


@router.get("/forecast", summary="Experimental Time-Series Fire Activity Forecast")
async def get_forecast(
    bbox: Optional[str] = Query(default="72.0,20.0,74.5,22.0"),
    horizon: int = Query(default=6, ge=1, le=12),
):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
    today = date.today()
    sd = date(2000, 1, 1)

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, today)
    harm = harmonize_observations(raw_df, 10.0)

    forecast_res = forecast_fire_activity(harm["monthly"], horizon_months=horizon)
    return forecast_res


@router.get("/regime-change", summary="Mann-Kendall Trend Test & Sen's Slope")
async def get_regime_change(
    bbox: Optional[str] = Query(default="72.0,20.0,74.5,22.0"),
):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
    today = date.today()
    sd = date(2000, 1, 1)

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, today)
    harm = harmonize_observations(raw_df, 10.0)

    # Annual aggregated HDI
    yearly_hdi: Dict[int, List[float]] = {}
    for r in harm["monthly"]:
        y = r["year"]
        yearly_hdi.setdefault(y, []).append(r["hdi"])

    sorted_years = sorted(yearly_hdi.keys())
    annual_averages = [float(np.mean(yearly_hdi[y])) for y in sorted_years]

    mk_result = calculate_mann_kendall_trend(annual_averages, years=sorted_years)
    mk_result["annual_series"] = [{"year": int(y), "mean_hdi": round(float(val), 2)} for y, val in zip(sorted_years, annual_averages)]
    
    # Cast all dictionary fields to standard Python primitive types
    clean_result: Dict[str, Any] = {}
    for k, v in mk_result.items():
        if isinstance(v, (np.bool_, bool)):
            clean_result[k] = bool(v)
        elif isinstance(v, (np.integer, int)):
            clean_result[k] = int(v)
        elif isinstance(v, (np.floating, float)):
            clean_result[k] = float(v)
        else:
            clean_result[k] = v
    return clean_result


@router.get("/fingerprint", summary="Global Burning Fingerprint & Similarity Search")
async def get_fingerprint(
    bbox: Optional[str] = Query(default="72.0,20.0,74.5,22.0"),
):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
    today = date.today()
    sd = date(2000, 1, 1)

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, today)
    harm = harmonize_observations(raw_df, 10.0)

    fingerprint = compute_burning_fingerprint(harm["monthly"])
    return fingerprint


@router.post("/compare-periods", summary="What-Changed Period-over-Period Differential Intelligence")
async def post_compare_periods(req: ComparePeriodsRequest):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(req.bbox)
    sd_a = _normalize_date_str(req.period_a_start, is_end=False)
    ed_a = _normalize_date_str(req.period_a_end, is_end=True)
    sd_b = _normalize_date_str(req.period_b_start, is_end=False)
    ed_b = _normalize_date_str(req.period_b_end, is_end=True)

    raw_a = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd_a, ed_a)
    raw_b = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd_b, ed_b)

    recs_a = [{"lat": r["latitude"], "lon": r["longitude"], "frp": r.get("frp", 10)} for _, r in raw_a.iterrows()]
    recs_b = [{"lat": r["latitude"], "lon": r["longitude"], "frp": r.get("frp", 10)} for _, r in raw_b.iterrows()]

    comparison = compare_observation_periods(recs_a, recs_b, req.label_a, req.label_b)
    return comparison


@router.post("/assistant/query", summary="Deterministic Natural Language Fire Intelligence Assistant")
async def post_assistant_query(req: AssistantQueryRequest):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(req.bbox or "72.0,20.0,74.5,22.0")
    today = date.today()
    sd = date(2000, 1, 1)

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, today)
    harm = harmonize_observations(raw_df, 10.0)

    ans = answer_fire_intelligence_query(req.query, harm["monthly"], aoi_name=req.aoi_name or "Selected AOI")
    return ans

