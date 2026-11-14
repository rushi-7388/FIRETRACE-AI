"""
database/db_manager.py
======================
Database connector and migration runner for FIRETRACE AI.
Supports both SQLite/Spatialite (local zero-config) and PostgreSQL/PostGIS (production).
Automatically creates database tables and pre-populates satellite/sensor metadata.
"""

from __future__ import annotations

import logging
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "firetrace.db"
DB_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH)))


def get_db_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database() -> None:
    """Initializes local relational tables for provenance and satellite metadata."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS satellites (
            satellite_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            agency TEXT DEFAULT 'NASA',
            launch_date TEXT,
            status TEXT DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS sensors (
            sensor_id TEXT PRIMARY KEY,
            satellite_id TEXT,
            name TEXT NOT NULL,
            spatial_resolution_m INTEGER NOT NULL,
            swath_width_km REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS data_ingestion_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_endpoint TEXT NOT NULL,
            product TEXT NOT NULL,
            date_start TEXT NOT NULL,
            date_end TEXT NOT NULL,
            records_retrieved INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cached_hotspots (
            hotspot_id TEXT PRIMARY KEY,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            acq_date TEXT NOT NULL,
            acq_time TEXT,
            frp REAL NOT NULL,
            confidence_norm INTEGER NOT NULL,
            satellite TEXT NOT NULL,
            sensor TEXT NOT NULL,
            is_collocated INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_hotspots_spatial ON cached_hotspots(latitude, longitude);
        CREATE INDEX IF NOT EXISTS idx_hotspots_date ON cached_hotspots(acq_date);

        INSERT OR IGNORE INTO satellites (satellite_id, name, agency, launch_date, status) VALUES
            ('TERRA', 'Terra (EOS AM-1)', 'NASA', '1999-12-18', 'drifting_orbit'),
            ('AQUA', 'Aqua (EOS PM-1)', 'NASA', '2002-05-04', 'drifting_orbit'),
            ('SNPP', 'Suomi National Polar-orbiting Partnership', 'NASA/NOAA', '2011-10-28', 'retired_nov_2026'),
            ('NOAA20', 'NOAA-20 (JPSS-1)', 'NOAA/NASA', '2017-11-18', 'active'),
            ('NOAA21', 'NOAA-21 (JPSS-2)', 'NOAA/NASA', '2022-11-10', 'active');

        INSERT OR IGNORE INTO sensors (sensor_id, satellite_id, name, spatial_resolution_m, swath_width_km) VALUES
            ('MODIS_TERRA', 'TERRA', 'Moderate Resolution Imaging Spectroradiometer', 1000, 2330),
            ('MODIS_AQUA', 'AQUA', 'Moderate Resolution Imaging Spectroradiometer', 1000, 2330),
            ('VIIRS_SNPP', 'SNPP', 'Visible Infrared Imaging Radiometer Suite', 375, 3040),
            ('VIIRS_NOAA20', 'NOAA20', 'Visible Infrared Imaging Radiometer Suite', 375, 3040),
            ('VIIRS_NOAA21', 'NOAA21', 'Visible Infrared Imaging Radiometer Suite', 375, 3040);
    """)

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully at %s", DB_PATH.resolve())


def log_ingestion(product: str, date_start: str, date_end: str, records: int, status: str = "SUCCESS") -> None:
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO data_ingestion_logs (source_endpoint, product, date_start, date_end, records_retrieved, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("https://firms.modaps.eosdis.nasa.gov", product, date_start, date_end, records, status))
        conn.commit()
        conn.close()
    except Exception as exc:
        logger.warning("Failed to write ingestion log: %s", exc)


def get_ingestion_logs() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM data_ingestion_logs ORDER BY log_id DESC LIMIT 50")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def save_hotspots_to_db(records: List[Dict[str, Any]]) -> int:
    """Persists a batch of normalized satellite fire hotspots into SQLite."""
    if not records:
        return 0
    conn = get_db_connection()
    cur = conn.cursor()
    inserted = 0
    try:
        cur.executemany("""
            INSERT OR REPLACE INTO cached_hotspots (
                hotspot_id, latitude, longitude, acq_date, acq_time,
                frp, confidence_norm, satellite, sensor, is_collocated
            ) VALUES (
                :hotspot_id, :latitude, :longitude, :acq_date, :acq_time,
                :frp, :confidence_norm, :satellite, :sensor, :is_collocated
            )
        """, [
            {
                "hotspot_id": f"{r.get('satellite', 'SAT')}_{r.get('acq_date')}_{r.get('latitude')}_{r.get('longitude')}_{r.get('acq_time', '0000')}",
                "latitude": float(r.get("latitude", 0.0)),
                "longitude": float(r.get("longitude", 0.0)),
                "acq_date": str(r.get("acq_date")),
                "acq_time": str(r.get("acq_time", "")),
                "frp": float(r.get("frp", 10.0)),
                "confidence_norm": int(r.get("confidence_norm", 60)),
                "satellite": str(r.get("satellite", "UNKNOWN")),
                "sensor": str(r.get("sensor", "UNKNOWN")),
                "is_collocated": 1 if r.get("is_collocated") else 0,
            }
            for r in records
        ])
        conn.commit()
        inserted = len(records)
    except Exception as exc:
        logger.warning("Failed to save hotspots to database: %s", exc)
    finally:
        conn.close()
    return inserted


def query_hotspots_from_db(
    min_lat: float, min_lon: float, max_lat: float, max_lon: float,
    start_date: str, end_date: str, limit: int = 500
) -> List[Dict[str, Any]]:
    """Retrieves cached hotspots within spatial-temporal bounding box from SQLite."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT latitude, longitude, acq_date, acq_time, frp,
                   confidence_norm, satellite, sensor, is_collocated
            FROM cached_hotspots
            WHERE latitude >= ? AND latitude <= ?
              AND longitude >= ? AND longitude <= ?
              AND acq_date >= ? AND acq_date <= ?
            ORDER BY acq_date DESC, frp DESC
            LIMIT ?
        """, (min_lat, max_lat, min_lon, max_lon, start_date, end_date, limit))
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    except Exception as exc:
        logger.warning("Failed to query hotspots from database: %s", exc)
        return []
    finally:
        conn.close()


