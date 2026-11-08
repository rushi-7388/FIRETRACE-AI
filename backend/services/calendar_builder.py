"""
services/calendar_builder.py
============================
Builds a calendar matrix from harmonized fire hotspot data for
FIRETRACE-AI visualization.

Output structure
----------------
{
  "calendar": {
    "<year>": {
      "<month>": {
        "hdi": float,
        "z_score": float,
        "raw_count": int,
        "is_anomaly": bool,
        "percentile": float,
        "color": "#RRGGBB"
      }
    }
  },
  "summary": {
    "annual_totals": {"<year>": int, ...},
    "peak_month_per_year": {"<year>": {"month": int, "hdi": float}, ...},
    "historical_median_per_month": {"<month>": float, ...},
    "overall_hdi_min": float,
    "overall_hdi_max": float,
    "total_hotspots": int,
    "years_covered": [int, ...],
    "anomaly_months": [{"year": int, "month": int, "z_score": float}, ...]
  }
}
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# YlOrRd color-scale breakpoints
# Colours sampled from ColorBrewer YlOrRd-5:
#   #FFFFCC (very low), #FEB24C (medium), #FC4E2A (high), #800026 (extreme)
# ---------------------------------------------------------------------------

# (hdi_percentile_0_to_1, hex_color)  — linear interpolation between knots
_COLOR_KNOTS: List[Tuple[float, Tuple[int, int, int]]] = [
    (0.00, (255, 255, 255)),  # white  — zero / no data
    (0.01, (255, 255, 204)),  # #FFFFCC
    (0.25, (254, 217, 142)),  # #FED98E
    (0.50, (254, 178,  76)),  # #FEB24C
    (0.75, (252,  78,  42)),  # #FC4E2A
    (0.90, (189,   0,  38)),  # #BD0026
    (1.00, (128,   0,  38)),  # #800026
]


def _lerp_color(t: float) -> str:
    """
    Linear-interpolate *t* ∈ [0, 1] through the YlOrRd knot table and
    return a hex color string ``#RRGGBB``.
    """
    t = max(0.0, min(1.0, t))
    for i in range(len(_COLOR_KNOTS) - 1):
        t0, c0 = _COLOR_KNOTS[i]
        t1, c1 = _COLOR_KNOTS[i + 1]
        if t0 <= t <= t1:
            if t1 == t0:
                r, g, b = c0
            else:
                f = (t - t0) / (t1 - t0)
                r = int(round(c0[0] + f * (c1[0] - c0[0])))
                g = int(round(c0[1] + f * (c1[1] - c0[1])))
                b = int(round(c0[2] + f * (c1[2] - c0[2])))
            return f"#{r:02X}{g:02X}{b:02X}"
    r, g, b = _COLOR_KNOTS[-1][1]
    return f"#{r:02X}{g:02X}{b:02X}"


def hdi_to_color(hdi: float, hdi_min: float, hdi_max: float) -> str:
    """
    Map an HDI value to a YlOrRd hex color.

    Parameters
    ----------
    hdi     : HDI value for this cell
    hdi_min : global minimum HDI (maps to white/very-light)
    hdi_max : global maximum HDI (maps to dark red)
    """
    if hdi_max <= hdi_min or hdi_max == 0:
        return "#FFFFFF"
    if hdi <= 0:
        return "#FFFFFF"
    t = (hdi - hdi_min) / (hdi_max - hdi_min)
    # Apply a mild square-root gamma to avoid all cells looking the same
    t = float(np.sqrt(max(0.0, t)))
    return _lerp_color(t)


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
}


def build_calendar(
    harmonized_df: pd.DataFrame,
    sensor_filter: str = "harmonized",
) -> Dict[str, Any]:
    """
    Build a calendar matrix and summary statistics from a harmonized
    DataFrame (output of ``services.harmonizer.harmonize``).

    Parameters
    ----------
    harmonized_df : output of harmonizer.harmonize()
    sensor_filter : which sensor row to use for the calendar.
                    Defaults to "harmonized" (the combined series).
                    Pass "MODIS" or "VIIRS_SNPP" for sensor-specific views.

    Returns
    -------
    dict with keys: "calendar", "summary"
    """
    if harmonized_df.empty:
        return _empty_response()

    # Filter to the requested sensor
    mask = harmonized_df["sensor"].str.lower() == sensor_filter.lower()
    df = harmonized_df[mask].copy()

    if df.empty:
        # Fall back to any available sensor
        df = harmonized_df.copy()
        logger.warning(
            "No rows for sensor '%s' — using all sensors.", sensor_filter
        )

    # Ensure correct types
    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].astype(int)
    df["raw_count"] = df["raw_count"].fillna(0).astype(int)
    df["hdi"] = df["hdi"].fillna(0.0).astype(float)
    df["z_score"] = df["z_score"].fillna(0.0).astype(float)
    df["is_anomaly"] = df["is_anomaly"].astype(bool)
    df["percentile"] = df["percentile"].fillna(50.0).astype(float)

    hdi_min = float(df["hdi"].min())
    hdi_max = float(df["hdi"].max())

    # ---- Calendar matrix ----
    calendar: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for _, row in df.iterrows():
        year_key = str(int(row["year"]))
        month_key = str(int(row["month"]))
        if year_key not in calendar:
            calendar[year_key] = {}
        calendar[year_key][month_key] = {
            "hdi": round(float(row["hdi"]), 6),
            "z_score": round(float(row["z_score"]), 4),
            "raw_count": int(row["raw_count"]),
            "is_anomaly": bool(row["is_anomaly"]),
            "percentile": round(float(row["percentile"]), 2),
            "color": hdi_to_color(float(row["hdi"]), hdi_min, hdi_max),
            "month_name": MONTH_NAMES.get(int(row["month"]), ""),
        }

    # ---- Annual totals ----
    annual_totals: Dict[str, int] = {}
    for year, grp in df.groupby("year"):
        annual_totals[str(int(year))] = int(grp["raw_count"].sum())

    # ---- Peak month per year ----
    peak_month_per_year: Dict[str, Dict[str, Any]] = {}
    for year, grp in df.groupby("year"):
        idx_max = grp["hdi"].idxmax()
        peak_row = grp.loc[idx_max]
        peak_month_per_year[str(int(year))] = {
            "month": int(peak_row["month"]),
            "month_name": MONTH_NAMES.get(int(peak_row["month"]), ""),
            "hdi": round(float(peak_row["hdi"]), 6),
            "raw_count": int(peak_row["raw_count"]),
        }

    # ---- Historical median HDI per calendar month ----
    historical_median: Dict[str, float] = {}
    for month, grp in df.groupby("month"):
        historical_median[str(int(month))] = round(float(grp["hdi"].median()), 6)

    # ---- Anomaly months list ----
    anomaly_rows = df[df["is_anomaly"]].copy()
    anomaly_months: List[Dict[str, Any]] = []
    for _, row in anomaly_rows.iterrows():
        anomaly_months.append(
            {
                "year": int(row["year"]),
                "month": int(row["month"]),
                "month_name": MONTH_NAMES.get(int(row["month"]), ""),
                "z_score": round(float(row["z_score"]), 4),
                "hdi": round(float(row["hdi"]), 6),
                "raw_count": int(row["raw_count"]),
                "direction": "above" if row["z_score"] > 0 else "below",
            }
        )
    anomaly_months.sort(key=lambda x: abs(x["z_score"]), reverse=True)

    years_covered = sorted(df["year"].unique().tolist())

    summary: Dict[str, Any] = {
        "annual_totals": annual_totals,
        "peak_month_per_year": peak_month_per_year,
        "historical_median_per_month": historical_median,
        "overall_hdi_min": round(hdi_min, 6),
        "overall_hdi_max": round(hdi_max, 6),
        "total_hotspots": int(df["raw_count"].sum()),
        "years_covered": years_covered,
        "anomaly_count": len(anomaly_months),
        "anomaly_months": anomaly_months,
        "sensor": sensor_filter,
    }

    return {"calendar": calendar, "summary": summary}


def _empty_response() -> Dict[str, Any]:
    return {
        "calendar": {},
        "summary": {
            "annual_totals": {},
            "peak_month_per_year": {},
            "historical_median_per_month": {},
            "overall_hdi_min": 0.0,
            "overall_hdi_max": 0.0,
            "total_hotspots": 0,
            "years_covered": [],
            "anomaly_count": 0,
            "anomaly_months": [],
            "sensor": "harmonized",
        },
    }
