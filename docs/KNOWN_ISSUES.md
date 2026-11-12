# FIRETRACE AI - Known Issues, Limitations & Risk Mitigation

**Project:** FIRETRACE AI  
**Event:** NASA Space Apps Challenge 2026  
**Document Reference:** FIRETRACE-ISSUES-V2.0  

---

## 1. Scientific & Remote Sensing Limitations

1. **Hotspots vs Burned Area:**
   - *Limitation:* Satellite active fire detections represent instantaneous thermal radiation observed at overpass times. They do not represent total burned area or perimeter growth.
   - *Mitigation:* The application explicitly labels metrics as **Hotspot Density Index (HDI)** and warns against equating hotspot counts with burned acreage.
2. **Cloud & Dense Smoke Attenuation:**
   - *Limitation:* Thick cloud decks or heavy pyrocumulonimbus plumes can attenuate thermal infrared radiance below detection thresholds, causing temporary false negatives.
   - *Mitigation:* The platform distinguishes **missing satellite observations** from **verified zero burning activity**.
3. **Orbital Revisit Interval Gaps:**
   - *Limitation:* Sun-synchronous polar orbiters (MODIS and VIIRS) sample any point 2 to 4 times per 24 hours. Fires ignited and extinguished between overpass windows are undetected.
   - *Mitigation:* All observation timestamps and satellite pass times are documented as discrete observation snapshots.

---

## 2. Technical & Performance Considerations

1. **Python 3.13 Binary Wheel Compatibility:**
   - *Issue:* Older pinned versions (`pandas==2.2.2`, `scipy==1.13.0`) required local C++ compiler tools on Python 3.13.
   - *Resolution:* Pinned dependencies in `backend/requirements.txt` relaxed to `>=` allowing modern pre-compiled wheels for Python 3.13.
2. **CARTO Basemap Deprecation:**
   - *Issue:* CARTO recently placed "API KEY REQUIRED" watermarks on unauthenticated raster tiles from `basemaps.cartocdn.com`.
   - *Resolution:* Completely eliminated CARTO raster tiles. Implemented free, zero-key **Esri Dark Gray Canvas**, **Esri World Imagery**, and **OpenStreetMap (OSM)** with an interactive basemap switcher.
3. **Large Spatial Query Latency:**
   - *Mitigation:* Bounding box queries on historical datasets implement local MD5-hashed caching to avoid redundant API fetches.

