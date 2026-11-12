# FIRETRACE AI - Comprehensive Testing Strategy

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Document Reference:** FIRETRACE-TEST-STRATEGY-V2.0  

---

## 1. Testing Philosophy

Testing is mandatory for scientific software. Visual rendering alone is not sufficient proof of correctness. FIRETRACE AI enforces a **four-layer testing hierarchy**:

```
+-----------------------------------------------------------------------------------+
| Layer 1: Unit Testing (Pure math, coordinate projection, confidence mapping)      |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Layer 2: Integration Testing (FastAPI routes, SQLite logging, export streams)     |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Layer 3: Scientific Validation (Controlled synthetic sets, non-merging checks)   |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
| Layer 4: End-to-End Workflow Testing (Complete AOI -> Calendar -> Export flow)    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Test Execution Commands

Run all backend automated tests:
```powershell
python -u -m pytest -v
```

Run focused test suites individually:
```powershell
# 1. Scientific validation & duplicate separation
python -m pytest backend/tests/test_scientific_validation.py -v

# 2. Harmonization engine & sinusoidal grid math
python -m pytest backend/tests/test_harmonizer.py -v

# 3. AI/ML Studio (DBSCAN, Mann-Kendall, SAR Forecast, Assistant)
python -m pytest backend/tests/test_ml_engine.py -v

# 4. API endpoints & system health
python -m pytest backend/tests/test_api_endpoints.py -v

# 5. Full integration pipeline & export streaming
python -m pytest backend/tests/test_integration_pipeline.py -v
```

Run frontend production compilation check:
```powershell
npm --prefix frontend run build
```

---

## 3. Scientific Validation Vectors (Section 14.4)

Controlled test cases verify that:
1. **Nearby Independent Fires Are Not Merged:** Fires separated by $> 1.5\text{ km}$ or occurring $> 30\text{ min}$ apart maintain separate identity.
2. **Collocated Afternoon Overpasses Are Non-Destructive:** Simultaneous Aqua MODIS and Suomi-NPP VIIRS passes flag `is_collocated = True` without deleting either sensor record.
3. **Invalid Coordinates Handled Gracefully:** Coordinates near polar singularities ($-89.5^\circ$, $+89.5^\circ$) undergo spherical cap meridian convergence without throwing division-by-zero errors.
4. **Empirical Cross-Sensor Scaling Verified:** Month 4 (April) applies $\alpha = 0.37$, ensuring $1\text{ MODIS} + 3\text{ VIIRS} \to 2.11\text{ Harmonized Units}$ instead of an uncalibrated count of 4.

