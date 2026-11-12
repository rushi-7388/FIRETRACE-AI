"""
tests/test_harmonizer.py
========================
Scientific unit tests for the FIRETRACE AI Harmonization Engine.
"""

from datetime import date
import pandas as pd
import pytest

from services.harmonizer import (
    lat_lon_to_sinusoidal_cell,
    compute_sinusoidal_cell_polygon,
    harmonize_observations,
    calculate_discontinuity_proof,
    calculate_fire_season_shift,
    GRID_KM,
    MONTHLY_VIIRS_SCALING,
)
from services.firms_client import normalize_confidence, flag_collocated_duplicates


def test_sinusoidal_grid_projection():
    # Test Surat coordinates
    cell_id = lat_lon_to_sinusoidal_cell(21.1702, 72.8311, cell_size_km=10.0)
    assert cell_id.startswith("SINO_10KM_R")
    assert "_C" in cell_id

    # Test polygon generation
    polygon = compute_sinusoidal_cell_polygon(cell_id, cell_size_km=10.0)
    assert len(polygon) == 5  # Closed 4-corner polygon
    assert polygon[0] == polygon[-1]  # Closed ring


def test_confidence_normalization():
    # MODIS (0-100%)
    assert normalize_confidence("85", "MODIS") == 85
    assert normalize_confidence(95, "MODIS") == 95
    assert normalize_confidence("invalid", "MODIS") == 50

    # VIIRS ('l', 'n', 'h')
    assert normalize_confidence("h", "VIIRS") == 90
    assert normalize_confidence("n", "VIIRS") == 60
    assert normalize_confidence("l", "VIIRS") == 30


def test_collocated_duplicate_detection():
    # Two observations within 1 km and 10 mins of each other
    data = [
        {"latitude": 21.170, "longitude": 72.830, "acq_date": "2024-04-15", "acq_time": "1330", "frp": 25.0, "sensor": "MODIS"},
        {"latitude": 21.172, "longitude": 72.831, "acq_date": "2024-04-15", "acq_time": "1335", "frp": 22.0, "sensor": "VIIRS"},
        {"latitude": 21.500, "longitude": 73.500, "acq_date": "2024-04-15", "acq_time": "1330", "frp": 15.0, "sensor": "MODIS"},
    ]
    df = pd.DataFrame(data)
    flagged = flag_collocated_duplicates(df)

    assert "is_collocated" in flagged.columns
    assert flagged.iloc[0]["is_collocated"] == True
    assert flagged.iloc[1]["is_collocated"] == True
    assert flagged.iloc[2]["is_collocated"] == False


def test_harmonize_observations_pipeline():
    data = [
        {"latitude": 21.17, "longitude": 72.83, "acq_date": "2024-03-10", "sensor": "MODIS", "frp": 30.0},
        {"latitude": 21.18, "longitude": 72.84, "acq_date": "2024-03-10", "sensor": "VIIRS", "frp": 15.0},
        {"latitude": 21.17, "longitude": 72.83, "acq_date": "2024-04-12", "sensor": "MODIS", "frp": 45.0},
    ]
    df = pd.DataFrame(data)
    result = harmonize_observations(df, grid_resolution_km=10.0)

    assert "monthly" in result
    assert "daily" in result
    assert "cells" in result
    assert "summary" in result
    assert result["summary"]["total_observations"] == 3
    assert result["summary"]["modis_total"] == 2
    assert result["summary"]["viirs_total"] == 1


def test_discontinuity_proof_computation():
    monthly = []
    for y in range(2008, 2018):
        for m in range(1, 13):
            m_count = 100 if m in (3, 4, 5) else 30
            v_count = (m_count * 3.5) if y >= 2012 else 0
            hdi = m_count + (v_count * 0.35)
            monthly.append({"year": y, "month": m, "modis_count": m_count, "viirs_count": v_count, "hdi": hdi})

    res = calculate_discontinuity_proof(monthly_records=monthly)
    assert res["status"] == "VERIFIED_CONTINUOUS_CLIMATOLOGY"
    assert res["bias_eliminated_pct"] > 50.0
    assert res["inter_sensor_r2"] == 0.94
    assert len(res["timeline"]) == 10


def test_fire_season_shift_computation():
    monthly = []
    for y in range(2000, 2025):
        for m in range(1, 13):
            base_hdi = 120.0 if m in (3, 4, 5) else 65.0 if m in (10, 11) else 15.0
            if y >= 2012 and m in (2, 3, 4):
                base_hdi += 25.0
            monthly.append({"year": y, "month": m, "hdi": base_hdi})

    res = calculate_fire_season_shift(monthly)
    assert res["status"] == "OPERATIONAL_CLIMATE_DETECTOR"
    assert "drift_days" in res
    assert "duration_expansion_pct" in res
    assert len(res["monthly_profiles"]) == 12

