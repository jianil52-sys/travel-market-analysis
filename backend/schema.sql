-- Neon/Postgres starter schema for verified source data.
-- The current dashboard uses data/demo-japan.json and does not write to a database.

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  publisher TEXT,
  source_url TEXT,
  update_frequency TEXT,
  methodology_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  name TEXT NOT NULL,
  english_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS attractions (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  name TEXT NOT NULL,
  english_name TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS tourism_observations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  period_year SMALLINT NOT NULL,
  period_quarter SMALLINT CHECK (period_quarter BETWEEN 1 AND 4),
  period_granularity TEXT NOT NULL CHECK (period_granularity IN ('month', 'quarter', 'year')),
  metric_code TEXT NOT NULL CHECK (
    metric_code IN ('inbound_visitors', 'outbound_visitors', 'city_visits', 'attraction_admissions')
  ),
  city_id TEXT REFERENCES cities(id),
  attraction_id TEXT REFERENCES attractions(id),
  origin_market_code TEXT,
  origin_market_type TEXT CHECK (
    origin_market_type IS NULL OR origin_market_type IN ('nationality', 'residence', 'source_market', 'region')
  ),
  value NUMERIC(18, 2) NOT NULL CHECK (value >= 0),
  unit TEXT NOT NULL DEFAULT 'visits',
  source_id TEXT NOT NULL REFERENCES data_sources(id),
  source_record_url TEXT,
  methodology_note TEXT,
  published_at DATE,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_granularity <> 'quarter' OR period_quarter IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS tourism_observations_lookup_idx
  ON tourism_observations (country_code, metric_code, period_year, period_quarter);

CREATE INDEX IF NOT EXISTS tourism_observations_market_idx
  ON tourism_observations (country_code, origin_market_type, origin_market_code, period_year, period_quarter);
