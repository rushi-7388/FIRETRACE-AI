"""
tests/test_integration_pipeline.py
==================================
Integration Pipeline Tests:
  - Ingestion data flow -> DB persistence -> Provenance logging
  - Endpoint integration with bbox and date filtering
  - Burning activity calendar matrix generation
  - Multi-format analytical export generation (CSV, GeoJSON, PDF)
  - AI/ML Intelligence endpoints (Clusters, Forecast, Regime Change, NL Assistant)
"""

import io
import pytest
import asyncio
from main import get_system_status, get_provenance
from routes.hotspots import get_hotspots
from routes.harmonize import get_calendar
from routes.export import export_data, ExportRequest
from routes.analytics_ml import (
    post_clusters, get_forecast, get_regime_change, post_assistant_query,
    ClusterRequest, AssistantQueryRequest
)
from database.db_manager import init_database


def test_full_pipeline_ingestion_and_provenance():
    init_database()
    # 1. Check system status
    status_res = get_system_status()
    assert status_res["status"] == "online"

    # 2. Check provenance
    prov_res = get_provenance()
    assert "satellites" in prov_res
    assert "sensors" in prov_res
    assert len(prov_res["satellites"]) >= 5


def test_hotspots_api_filtering():
    # Retrieve raw hotspots with bbox and date filter
    res = asyncio.run(get_hotspots(
        bbox="72.6,21.0,73.2,21.4",
        start_date="2024-04-01",
        end_date="2024-04-10",
        sensor="both"
    ))
    assert res["type"] == "FeatureCollection"
    assert "features" in res
    assert "hotspots" in res


def test_calendar_and_harmonize_endpoints():
    cal_data = asyncio.run(get_calendar(
        bbox="72.6,21.0,73.2,21.4",
        start_date="2024-04-01",
        end_date="2024-04-10"
    ))
    assert "rows" in cal_data
    assert "summary" in cal_data
    assert "calendar_matrix" in cal_data


async def _read_streaming(res) -> bytes:
    chunks = []
    async for chunk in res.body_iterator:
        if isinstance(chunk, str):
            chunks.append(chunk.encode("utf-8"))
        else:
            chunks.append(chunk)
    return b"".join(chunks)


def test_export_endpoints_csv_and_pdf():
    async def run_exports():
        # 1. CSV export
        req_csv = ExportRequest(
            bbox="72.6,21.0,73.2,21.4",
            start_date="2024-04-01",
            end_date="2024-04-05",
            format="csv",
            data_type="all"
        )
        csv_res = await export_data(req_csv)
        assert "text/csv" in csv_res.headers.get("content-type", "")
        csv_body = await _read_streaming(csv_res)
        assert b"latitude" in csv_body

        # 2. PDF report export
        req_pdf = ExportRequest(
            bbox="72.6,21.0,73.2,21.4",
            start_date="2024-04-01",
            end_date="2024-04-05",
            format="pdf_summary",
            data_type="all"
        )
        pdf_res = await export_data(req_pdf)
        assert "application/pdf" in pdf_res.headers.get("content-type", "")
        pdf_body = await _read_streaming(pdf_res)
        assert pdf_body.startswith(b"%PDF-")

    asyncio.run(run_exports())


def test_ml_endpoints_integration():
    # 1. DBSCAN clusters endpoint
    cl_req = ClusterRequest(
        bbox="72.0,20.0,74.5,22.0",
        eps_km=15.0,
        min_samples=3,
        days_back=7
    )
    cl_res = asyncio.run(post_clusters(cl_req))
    assert "cluster_count" in cl_res

    # 2. Forecast endpoint
    fc_res = asyncio.run(get_forecast(bbox="72.0,20.0,74.5,22.0", horizon=3))
    assert "forecast" in fc_res

    # 3. Regime change endpoint
    rc_res = asyncio.run(get_regime_change(bbox="72.0,20.0,74.5,22.0"))
    assert "p_value" in rc_res
    assert "mann_kendall_s" in rc_res or "mann_kendall_stat" in rc_res

    # 4. Assistant query endpoint
    asst_req = AssistantQueryRequest(
        query="Which month had peak activity?",
        bbox="72.0,20.0,74.5,22.0"
    )
    asst_res = asyncio.run(post_assistant_query(asst_req))
    assert "answer" in asst_res
