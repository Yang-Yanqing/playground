CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  raw JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  inserted_rows INTEGER NOT NULL,
  updated_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  error_rows INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- UNIQUE(source, external_id) 是“幂等导入/去重”的硬保证；
-- ingest_runs 让导入可追溯，面试官很吃这套。