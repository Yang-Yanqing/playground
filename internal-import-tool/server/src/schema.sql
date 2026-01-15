-- Why this file exists:
-- A reproducible internal tool must define its persistence schema explicitly
-- so the system can be recreated in any environment.

CREATE TABLE IF NOT EXISTS import_jobs (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED')),
  source_url TEXT,
  raw_text TEXT,
  checksum TEXT NOT NULL UNIQUE,         -- Idempotency key (dedupe)
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imported_records (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imported_records_job_id ON imported_records(job_id);
            