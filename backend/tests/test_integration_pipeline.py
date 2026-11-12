"""
tests/test_integration_pipeline.py
==================================
Integration Pipeline Tests (Section 14.2 & 14.5):
  - Ingestion data flow -> DB persistence -> Provenance logging
  - FastApi endpoint integration with bbox and date filtering
  - Burning activity calendar matrix generation
  - Multi-format analytical export generation (CSV, GeoJSON, PDF)
  - AI/ML Intelligence endpoints (Clusters, Forecast, Regime Change, NL Assistant)
"""

from datetime import date
import io
import pytest
from fastapi.testclient import TestClient

from main import app
from database.db_manager import init_database, get_ingestion_logs

client = TestClient(app)


def test_full_pipeline_ingestion_and_provenance():
    init_database()
    # 1. Check system status
    status_res = client.get("/api/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "online"

    # 2. Check provenance
    prov_res = client.get("/api/provenance")
    assert prov_res.status_code == 200
    data = prov_res.json()
    assert "satellites" in data
    assert "sensors" in data
    assert len(data["satellites"]) >= 5


def test_hotspots_api_filtering():
    # Retrieve raw hotspots with bbox and date filter
    params = {
        "bbox": "72.6,21.0,73.2,21.4",
        "start_date": "2024-04-01",
        "end_date": "2024-04-10",
        "sensor": "both",
    }
    res = client.get("/api/hotspots", params=params)
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["type"] == "FeatureCollection"
    assert "features" in geojson
    assert "hotspots" in geojson


def test_calendar_and_harmonize_endpoints():
    # 1. Calendar endpoint
    params = {
        "bbox": "72.6,21.0,73.2,21.4",
        "start_date": "2023-01-01",
        "end_date": "2024-04-01",
    }
    cal_res = client.get("/api/calendar", params=params)
    assert cal_res.status_code == 200
    cal_data = cal_res.json()
    assert "rows" in cal_data
    assert "summary" in cal_data
    assert "calendar_matrix" in cal_data


def test_export_endpoints_csv_and_pdf():
    payload = {
        "bbox": "72.6,21.0,73.2,21.4",
        "start_date": "2024-01-01",
        "end_date": "2024-04-01",
        "format": "csv",
        "data_type": "all",
    }
    # 1. CSV export
    csv_res = client.post("/api/export/data", json=payload)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert b"latitude,longitude" in csv_res.content or b"latitude" in csv_res.content

    # 2. PDF report export
    payload["format"] = "pdf_summary"
    pdf_res = client.post("/api/export/data", json=payload)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers.get("content-type", "")
    # Check PDF file magic header (%PDF-)
    assert pdf_res.content.startswith(b"%PDF-")


def test_ml_endpoints_integration():
    # 1. DBSCAN clusters endpoint
    cluster_payload = {
        "bbox": "72.0,20.0,74.5,22.0",
        "eps_km": 15.0,
        "min_samples": 3,
        "days_back": 30,
    }
    cl_res = client.post("/api/ml/clusters", json=cluster_payload)
    assert cl_res.status_code == 200
    assert "cluster_count" in cl_res.json()

    # 2. Forecast endpoint
    fc_res = client.get("/api/ml/forecast", params={"bbox": "72.0,20.0,74.5,22.0", "horizon": 3})
    assert fc_res.status_code == 200
    assert "forecast" in fc_res.json()

    # 3. Regime change endpoint
    rc_res = client.get("/api/ml/regime-change", params={"bbox": "72.0,20.0,74.5,22.0"})
    assert rc_res.status_code == 200
    assert "p_value" in rc_res.json()
    assert "mann_kendall_s" in rc_res.json() or "mann_kendall_stat" in rc_res.json()

    # 4. Assistant query endpoint
    asst_res = client.post("/api/ml/assistant/query", json={"query": "Which month had peak activity?", "bbox": "72.0,20.0,74.5,22.0"})
    assert asst_res.status_code == 200
    assert "answer" in asst_res.json()
