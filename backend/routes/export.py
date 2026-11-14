"""
routes/export.py
================
Multi-format report generation:
  - CSV (selected observations / harmonized series)
  - GeoJSON (spatial point features with original metadata)
  - JSON (structured satellite observations & metadata)
  - PDF Report Summary (executive analytics data for printing/downloading)
"""

from __future__ import annotations

import io
import json
import logging
from datetime import date
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.firms_client import fetch_satellite_data
from services.harmonizer import harmonize_observations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["export"])


class ExportRequest(BaseModel):
    bbox: str = Field(..., description="min_lon,min_lat,max_lon,max_lat")
    start_date: str = Field(...)
    end_date: str = Field(...)
    satellites: Optional[List[str]] = Field(default=None)
    format: str = Field(default="csv", description="csv, geojson, json, or pdf_summary")
    data_type: Optional[str] = Field(default="all", description="all, raw_modis, raw_viirs, harmonized_monthly, daily, matched, or anomalies")


def _parse_bbox(bbox_str: str) -> tuple[float, float, float, float]:
    parts = bbox_str.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=422, detail="bbox must be 'min_lon,min_lat,max_lon,max_lat'")
    return float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])


@router.post("/data", summary="Export observations or harmonized data in multiple formats")
async def export_data(req: ExportRequest):
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(req.bbox)
    try:
        sd = date.fromisoformat(req.start_date if len(req.start_date) == 10 else f"{req.start_date}-01")
        ed = date.fromisoformat(req.end_date if len(req.end_date) == 10 else f"{req.end_date}-28")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid date: {exc}")

    raw_df = await fetch_satellite_data(min_lat, min_lon, max_lat, max_lon, sd, ed, req.satellites)

    # Filter or aggregate based on requested data_type
    export_df = raw_df
    dtype = (req.data_type or "all").lower()

    if dtype == "raw_modis":
        export_df = raw_df[raw_df["sensor"].str.upper().str.contains("MODIS")]
    elif dtype == "raw_viirs":
        export_df = raw_df[raw_df["sensor"].str.upper().str.contains("VIIRS")]
    elif dtype == "matched":
        if "is_collocated" in raw_df.columns:
            export_df = raw_df[raw_df["is_collocated"] == True]
        else:
            export_df = raw_df.head(0)
    elif dtype in ("harmonized_monthly", "daily", "anomalies"):
        harm = harmonize_observations(raw_df)
        if dtype == "harmonized_monthly":
            export_df = pd.DataFrame(harm["monthly"])
        elif dtype == "daily":
            export_df = pd.DataFrame(harm["daily"])
        elif dtype == "anomalies":
            export_df = pd.DataFrame([r for r in harm["monthly"] if r.get("is_anomaly")])

    # 1. CSV Format
    if req.format.lower() == "csv":
        buf = io.StringIO()
        export_df.to_csv(buf, index=False)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=firetrace_{dtype}_{sd}_{ed}.csv"},
        )

    # 2. GeoJSON Format
    elif req.format.lower() == "geojson":
        features = []
        for _, row in raw_df.iterrows():
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row["longitude"]), float(row["latitude"])],
                },
                "properties": {
                    "acq_date": str(row["acq_date"]),
                    "acq_time": str(row["acq_time"]),
                    "frp": float(row["frp"]),
                    "confidence_raw": str(row["confidence_raw"]),
                    "confidence_norm": int(row["confidence_norm"]),
                    "satellite": str(row["satellite"]),
                    "sensor": str(row["sensor"]),
                    "processing_type": str(row["processing_type"]),
                },
            })
        geojson_obj = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "source": "NASA FIRMS MODIS & VIIRS",
                "bbox": req.bbox,
                "date_range": [sd.isoformat(), ed.isoformat()],
                "count": len(features),
            },
        }
        buf = io.StringIO(json.dumps(geojson_obj, indent=2))
        return StreamingResponse(
            buf,
            media_type="application/geo+json",
            headers={"Content-Disposition": f"attachment; filename=firetrace_nasa_hotspots_{sd}_{ed}.geojson"},
        )

    # 3. JSON Format
    elif req.format.lower() == "json":
        data_list = raw_df.to_dict(orient="records")
        buf = io.StringIO(json.dumps(data_list, indent=2, default=str))
        return StreamingResponse(
            buf,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=firetrace_nasa_hotspots_{sd}_{ed}.json"},
        )

    # 4. Official NASA PDF Executive Report
    elif req.format.lower() in ("pdf", "pdf_summary"):
        from services.pdf_generator import generate_executive_pdf_report
        harm = harmonize_observations(raw_df)
        anomalies = [r for r in harm.get("monthly", []) if r.get("is_anomaly")]
        anomalies.sort(key=lambda x: abs(x.get("z_score", 0)), reverse=True)

        pdf_bytes = generate_executive_pdf_report(
            bbox=req.bbox,
            date_start=sd.isoformat(),
            date_end=ed.isoformat(),
            satellites=req.satellites or ["TERRA", "AQUA", "SNPP", "NOAA20", "NOAA21"],
            total_obs=harm["summary"]["total_observations"],
            modis_count=harm["summary"]["modis_total"],
            viirs_count=harm["summary"]["viirs_total"],
            overall_mean_frp=harm["summary"]["overall_mean_frp"],
            peak_month=harm["summary"]["peak_month"],
            anomaly_count=harm["summary"]["anomaly_count"],
            top_anomalies=anomalies[:5],
        )

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=firetrace_nasa_executive_report_{sd}_{ed}.pdf"},
        )


@router.post("/csv", summary="Backward-compatible CSV download")
async def export_csv(req: ExportRequest):
    req.format = "csv"
    return await export_data(req)
