"""
database/schema.sql
===================
PostgreSQL + PostGIS schema for FIRETRACE AI.
Provides relational storage for raw NASA observations,
10 km equal-area harmonized cells, sensor metadata,
and data provenance.
"""

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Satellites
CREATE TABLE IF NOT EXISTS satellites (
    satellite_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    agency VARCHAR(32) DEFAULT 'NASA',
    launch_date DATE,
    orbit_type VARCHAR(32) DEFAULT 'Sun-synchronous',
    status VARCHAR(16) DEFAULT 'active'
);

INSERT INTO satellites (satellite_id, name, agency, launch_date, status) VALUES
    ('TERRA', 'Terra (EOS AM-1)', 'NASA', '1999-12-18', 'active'),
    ('AQUA', 'Aqua (EOS PM-1)', 'NASA', '2002-05-04', 'active'),
    ('SNPP', 'Suomi National Polar-orbiting Partnership', 'NASA/NOAA', '2011-10-28', 'active'),
    ('NOAA20', 'NOAA-20 (JPSS-1)', 'NOAA/NASA', '2017-11-18', 'active'),
    ('NOAA21', 'NOAA-21 (JPSS-2)', 'NOAA/NASA', '2022-11-10', 'active')
ON CONFLICT (satellite_id) DO NOTHING;

-- 2. Sensors
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id VARCHAR(32) PRIMARY KEY,
    satellite_id VARCHAR(32) REFERENCES satellites(satellite_id),
    name VARCHAR(64) NOT NULL,
    spatial_resolution_m INTEGER NOT NULL,
    swath_width_km NUMERIC NOT NULL,
    spectral_channels VARCHAR(128)
);

INSERT INTO sensors (sensor_id, satellite_id, name, spatial_resolution_m, swath_width_km, spectral_channels) VALUES
    ('MODIS_TERRA', 'TERRA', 'Moderate Resolution Imaging Spectroradiometer', 1000, 2330, 'Channels 21/22 (3.9um), 31 (11.0um)'),
    ('MODIS_AQUA', 'AQUA', 'Moderate Resolution Imaging Spectroradiometer', 1000, 2330, 'Channels 21/22 (3.9um), 31 (11.0um)'),
    ('VIIRS_SNPP', 'SNPP', 'Visible Infrared Imaging Radiometer Suite', 375, 3040, 'I4 (3.74um), I5 (11.45um)'),
    ('VIIRS_NOAA20', 'NOAA20', 'Visible Infrared Imaging Radiometer Suite', 375, 3040, 'I4 (3.74um), I5 (11.45um)'),
    ('VIIRS_NOAA21', 'NOAA21', 'Visible Infrared Imaging Radiometer Suite', 375, 3040, 'I4 (3.74um), I5 (11.45um)')
ON CONFLICT (sensor_id) DO NOTHING;

-- 3. Raw Fire Observations (Immutable Source of Truth)
CREATE TABLE IF NOT EXISTS fire_observations (
    observation_id BIGSERIAL PRIMARY KEY,
    satellite VARCHAR(32) NOT NULL,
    sensor VARCHAR(32) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(8, 4) NOT NULL,
    longitude NUMERIC(8, 4) NOT NULL,
    acq_date DATE NOT NULL,
    acq_time VARCHAR(4) NOT NULL,
    frp NUMERIC(8, 2),
    brightness NUMERIC(8, 2),
    confidence_raw VARCHAR(16) NOT NULL,
    confidence_normalized INTEGER NOT NULL,
    processing_type VARCHAR(8) NOT NULL, -- 'NRT' or 'SP'
    source_product VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fire_obs_geom ON fire_observations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_fire_obs_date ON fire_observations(acq_date);
CREATE INDEX IF NOT EXISTS idx_fire_obs_sensor ON fire_observations(sensor);

-- 4. 10 km Equal-Area Harmonized Grid Cells
CREATE TABLE IF NOT EXISTS harmonized_cells (
    cell_id VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    area_km2 NUMERIC(8, 2) NOT NULL,
    modis_count INTEGER DEFAULT 0,
    viirs_count INTEGER DEFAULT 0,
    harmonized_count NUMERIC(10, 2) NOT NULL,
    hdi NUMERIC(10, 4) NOT NULL,
    mean_frp NUMERIC(8, 2),
    max_frp NUMERIC(8, 2),
    z_score NUMERIC(8, 4),
    is_anomaly BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (cell_id, date)
);
CREATE INDEX IF NOT EXISTS idx_harm_cells_geom ON harmonized_cells USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_harm_cells_date ON harmonized_cells(date);

-- 5. Data Ingestion & Provenance Logs
CREATE TABLE IF NOT EXISTS data_ingestion_logs (
    log_id BIGSERIAL PRIMARY KEY,
    source_endpoint VARCHAR(256) NOT NULL,
    product VARCHAR(64) NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    records_retrieved INTEGER NOT NULL,
    records_inserted INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

