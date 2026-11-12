"""
tests/test_ml_engine.py
=======================
Unit tests for FIRETRACE AI Machine Learning and Statistical Intelligence:
  - DBSCAN spatial clustering
  - Mann-Kendall trend test & Sen's slope
  - Experimental time-series forecasting & error metrics
  - Global burning fingerprint & biome similarity
  - Deterministic Natural Language assistant
"""

import pytest
from services.ml_engine import (
    detect_hotspot_clusters,
    calculate_mann_kendall_trend,
    forecast_fire_activity,
    compute_burning_fingerprint,
    compare_observation_periods,
    answer_fire_intelligence_query,
)


def test_dbscan_clustering():
    # 5 points clustered tightly in Surat, 1 isolated point in Kutch
    hotspots = [
        {"lat": 21.170, "lon": 72.830, "frp": 25.0, "date": "2024-04-10", "sensor": "MODIS"},
        {"lat": 21.175, "lon": 72.835, "frp": 30.0, "date": "2024-04-10", "sensor": "VIIRS"},
        {"lat": 21.180, "lon": 72.840, "frp": 28.0, "date": "2024-04-11", "sensor": "VIIRS"},
        {"lat": 21.185, "lon": 72.845, "frp": 22.0, "date": "2024-04-12", "sensor": "MODIS"},
        {"lat": 23.500, "lon": 69.800, "frp": 12.0, "date": "2024-04-10", "sensor": "MODIS"},
    ]

    res = detect_hotspot_clusters(hotspots, eps_km=15.0, min_samples=3)
    assert "cluster_count" in res
    assert res["cluster_count"] >= 1
    top = res["clusters"][0]
    assert top["hotspot_count"] >= 3
    assert "centroid" in top
    assert top["persistence_status"] in ["Persistent Multi-Day Burning", "Multi-Pass Event", "Single-Day Incident"]


def test_mann_kendall_trend():
    # Monotonically increasing series
    series_up = [10.0, 12.0, 15.0, 18.0, 22.0, 26.0, 31.0]
    res_up = calculate_mann_kendall_trend(series_up)
    assert res_up["is_statistically_significant"] == True
    assert res_up["standardized_z"] > 0
    assert "Upward Drift" in res_up["trend_classification"]
    assert res_up["sens_slope_per_year"] > 0

    # Flat series
    series_flat = [15.0, 14.9, 15.1, 15.0, 15.0, 14.8, 15.2]
    res_flat = calculate_mann_kendall_trend(series_flat)
    assert res_flat["is_statistically_significant"] == False
    assert "Stable" in res_flat["trend_classification"]


def test_fire_forecasting():
    # Generate 36 months of test data with realistic seasonal pattern
    monthly_data = []
    for y in [2021, 2022, 2023]:
        for m in range(1, 13):
            base = 25.0 if m in (3, 4, 5) else 8.0
            monthly_data.append({"year": y, "month": m, "hdi": base + (m * 0.2)})

    fc = forecast_fire_activity(monthly_data, horizon_months=6)
    assert fc["status"] == "success"
    assert len(fc["forecast"]) == 6
    assert "backtest_evaluation" in fc
    assert fc["backtest_evaluation"]["mae"] >= 0
    assert fc["backtest_evaluation"]["rmse"] >= 0
    assert "ci_80" in fc["forecast"][0]
    assert "ci_95" in fc["forecast"][0]


def test_burning_fingerprint():
    # 24 months bimodal pattern (peaks in March & October)
    monthly_data = []
    for y in [2022, 2023]:
        for m in range(1, 13):
            val = 30.0 if m in (3, 4, 5) else 20.0 if m in (10, 11) else 5.0
            monthly_data.append({"year": y, "month": m, "hdi": val})

    fp = compute_burning_fingerprint(monthly_data)
    assert len(fp["monthly_signature"]) == 12
    assert "closest_matching_regime" in fp
    assert fp["closest_matching_regime"]["similarity_pct"] > 50.0


def test_natural_language_assistant():
    sample_data = [
        {"year": 2023, "month": 4, "hdi": 45.2, "harmonized_count": 180, "z_score": 2.8, "is_anomaly": True},
        {"year": 2023, "month": 5, "hdi": 30.1, "harmonized_count": 110, "z_score": 1.4, "is_anomaly": False},
        {"year": 2023, "month": 10, "hdi": 25.0, "harmonized_count": 95, "z_score": 0.8, "is_anomaly": False, "historical_median": 20.0},
    ]

    # Query 1: Peak month
    ans1 = answer_fire_intelligence_query("Which month had the highest activity?", sample_data, "Surat")
    assert "highest burning activity" in ans1["answer"].lower()
    assert "45.20" in ans1["answer"]

    # Query 2: October comparison
    ans2 = answer_fire_intelligence_query("How does October compare?", sample_data, "Surat")
    assert "october" in ans2["answer"].lower()
    assert "historical median" in ans2["answer"].lower()

    # Query 3: Sensor difference
    ans3 = answer_fire_intelligence_query("What is the difference between MODIS and VIIRS?", sample_data, "Surat")
    assert "375m" in ans3["answer"]
    assert "1,000m" in ans3["answer"]

