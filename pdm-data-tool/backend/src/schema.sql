-- Why this exists:
-- A clear relational model that supports idempotent ingestion, status tracking,
-- and retry workflows is the core of internal data tooling.

-- Source: where data comes from (e.g., "tiktok-shop", "gelbe-seiten", "csv-upload")
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import run: one ingestion execution (even if records already exist)
CREATE TABLE IF NOT EXISTS import_runs (
  id SERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'RUNNING',  -- RUNNING | DONE | FAILED
  total_count INT NOT NULL DEFAULT 0,
  inserted_count INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Record status: simple but expressive enough for one-day implementation
-- PENDING: ingested but not processed (or scheduled to retry)
-- OK: cleaned/accepted
-- FAILED: failed validation/processing
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  import_run_id INT NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,

  external_id TEXT NOT NULL,              -- unique key from upstream (or generated)
  raw JSONB NOT NULL,                     -- keep raw payload for debugging / reproducibility
  normalized JSONB,                       -- cleaned/normalized payload
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | OK | FAILED

  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: a record is unique within a source.
-- This is the core of "repeatable ingestion" in data tooling.
CREATE UNIQUE INDEX IF NOT EXISTS uq_records_source_external
  ON records(source_id, external_id);

CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
CREATE INDEX IF NOT EXISTS idx_records_import_run ON records(import_run_id);
