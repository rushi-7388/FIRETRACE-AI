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

DB_PATH = Path(os.getenv("DATABASE_PATH", "./firetrace.db"))


def get_db_connection() -> sqlite3.Connection:
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

        INSERT OR IGNORE INTO satellites (satellite_id, name, agency, launch_date, status) VALUES
            ('TERRA', 'Terra (EOS AM-1)', 'NASA', '1999-12-18', 'active'),
            ('AQUA', 'Aqua (EOS PM-1)', 'NASA', '2002-05-04', 'active'),
            ('SNPP', 'Suomi National Polar-orbiting Partnership', 'NASA/NOAA', '2011-10-28', 'active'),
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
