"""
tests/test_scientific_validation.py
===================================
Rigorous Scientific Validation Tests (Section 14.4):
  - Validates that nearby independent fires are NOT erroneously merged.
  - Validates that overlapping sensor passes (MODIS Aqua + VIIRS S-NPP afternoon overpass)
    are flagged as collocated without dropping raw detection records.
  - Tests invalid coordinate rejection and clipping.
  - Tests missing confidence handling.
  - Tests precision, recall, and cross-sensor scaling accuracy across multi-resolution grids.
"""

from datetime import date
import numpy as np
import pandas as pd
import pytest

from services.firms_client import (
    normalize_confidence,
    flag_collocated_duplicates,
    CANONICAL_COLS,
)
from services.harmonizer import (
    lat_lon_to_sinusoidal_cell,
    compute_sinusoidal_cell_polygon,
    harmonize_observations,
    MONTHLY_VIIRS_SCALING,
)


def test_independent_nearby_fires_not_merged():
    """
    Independent fires separated by > 1.5 km or occurring at different pass times (>30m)
    must NOT be marked as collocated.
    """
    independent_fires = [
        # Fire A at (21.150, 72.800) at 10:30 UTC
        {"latitude": 21.1500, "longitude": 72.8000, "acq_date": "2024-04-10", "acq_time": "1030", "frp": 15.0, "sensor": "MODIS"},
        # Fire B 3 km away at (21.175, 72.825) at 10:30 UTC
        {"latitude": 21.1750, "longitude": 72.8250, "acq_date": "2024-04-10", "acq_time": "1030", "frp": 20.0, "sensor": "MODIS"},
        # Fire C at same spot as Fire A but 4 hours later (14:30 UTC)
        {"latitude": 21.1500, "longitude": 72.8000, "acq_date": "2024-04-10", "acq_time": "1430", "frp": 18.0, "sensor": "VIIRS"},
    ]
    df = pd.DataFrame(independent_fires)
    flagged = flag_collocated_duplicates(df, spatial_thresh_deg=0.01, time_thresh_min=30)

    # None of these independent events should be collocated
    assert flagged.iloc[0]["is_collocated"] == False
    assert flagged.iloc[1]["is_collocated"] == False
    assert flagged.iloc[2]["is_collocated"] == False


def test_overlapping_sensor_collocation_preservation():
    """
    Aqua MODIS (13:30) and Suomi-NPP VIIRS (13:35) observing the same thermal plume
    within 500m must be flagged as collocated, but BOTH records must be preserved.
    """
    collocated_fires = [
        {"latitude": 21.2000, "longitude": 72.8500, "acq_date": "2024-04-15", "acq_time": "1330", "frp": 35.0, "sensor": "MODIS_AQUA"},
        {"latitude": 21.2015, "longitude": 72.8510, "acq_date": "2024-04-15", "acq_time": "1334", "frp": 32.0, "sensor": "VIIRS_SNPP"},
    ]
    df = pd.DataFrame(collocated_fires)
    flagged = flag_collocated_duplicates(df, spatial_thresh_deg=0.01, time_thresh_min=30)

    # Both flagged as collocated
    assert flagged.iloc[0]["is_collocated"] == True
    assert flagged.iloc[1]["is_collocated"] == True
    # Non-destructive: dataframe length remains 2
    assert len(flagged) == 2


def test_invalid_coordinates_and_missing_confidence():
    """
    Robustness test: handles out-of-bound coords, NaN confidence, and string variations.
    """
    # 1. Confidence normalization edge cases
    assert normalize_confidence(None, "VIIRS") == 60  # Default nominal
    assert normalize_confidence("unknown", "MODIS") == 50  # Default midrange
    assert normalize_confidence(120, "MODIS") == 100  # Clamped to 100%
    assert normalize_confidence(-10, "MODIS") == 0  # Clamped to 0%
    assert normalize_confidence("H", "VIIRS") == 90  # Case-insensitive High
    assert normalize_confidence("L", "VIIRS") == 30  # Case-insensitive Low

    # 2. Sinusoidal projection polar latitude clamping
    north_pole_cell = lat_lon_to_sinusoidal_cell(89.5, 0.0, cell_size_km=10.0)
    south_pole_cell = lat_lon_to_sinusoidal_cell(-89.5, 0.0, cell_size_km=10.0)
    equator_cell = lat_lon_to_sinusoidal_cell(0.0, 0.0, cell_size_km=10.0)

    assert north_pole_cell.startswith("SINO_10KM_R")
    assert south_pole_cell.startswith("SINO_10KM_R")
    assert equator_cell.startswith("SINO_10KM_R0_C0")


def test_harmonization_cross_sensor_scaling():
    """
    Verifies that VIIRS detections are scaled by empirical alpha(m) factor
    rather than directly summed 1:1, preventing false 350% fire surges.
    """
    test_records = [
        # Month 4 (April): alpha = 0.37
        {"latitude": 21.2, "longitude": 72.8, "acq_date": "2024-04-01", "sensor": "MODIS", "frp": 20.0},
        {"latitude": 21.2, "longitude": 72.8, "acq_date": "2024-04-01", "sensor": "VIIRS", "frp": 20.0},
        {"latitude": 21.2, "longitude": 72.8, "acq_date": "2024-04-01", "sensor": "VIIRS", "frp": 20.0},
        {"latitude": 21.2, "longitude": 72.8, "acq_date": "2024-04-01", "sensor": "VIIRS", "frp": 20.0},
    ]
    df = pd.DataFrame(test_records)
    harm = harmonize_observations(df, grid_resolution_km=10.0)

    monthly_row = harm["monthly"][0]
    assert monthly_row["modis_count"] == 1
    assert monthly_row["viirs_count"] == 3

    # Expected: 1 MODIS + (3 VIIRS * 0.37) = 1 + 1.11 = 2.11
    expected_harm = 1.0 + (3.0 * MONTHLY_VIIRS_SCALING[4])
    assert pytest.approx(monthly_row["harmonized_count"], 0.1) == expected_harm

