"""
tests/test_api_endpoints.py
===========================
Direct unit tests for API route handlers:
  - Root endpoint
  - System status & NASA FIRMS health
  - Satellite provenance & ingestion audit
  - Cross-sensor overlap calibration coefficients
"""

from main import root, get_system_status, get_provenance
from routes.harmonize import get_overlap_validation


def test_root_endpoint():
    res = root()
    assert res["project"] == "FIRETRACE-AI"
    assert "endpoints" in res
    assert res["version"] == "1.0.0"


def test_status_endpoint():
    res = get_system_status()
    assert res["status"] == "online"
    assert res["service"] == "FIRETRACE-AI"
    assert "capabilities" in res
    assert "HOTSPOT_DENSITY_INDEX" in res["capabilities"]


def test_provenance_endpoint():
    from database.db_manager import init_database
    init_database()
    res = get_provenance()
    assert "satellites" in res
    assert len(res["satellites"]) >= 5
    assert "sensors" in res
    assert len(res["sensors"]) >= 5


def test_validation_overlap():
    res = get_overlap_validation()
    assert "mean_count_ratio_viirs_to_modis" in res
    assert "monthly_scaling_table" in res
    assert len(res["monthly_scaling_table"]) == 12
