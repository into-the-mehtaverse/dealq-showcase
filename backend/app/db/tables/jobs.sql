CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',     -- queued|running|succeeded|failed
  stage  text,                               -- e.g. 'parse_om', 'extract_t12', ...
  error_text text,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  finished_at timestamptz
);

-- One active job per deal (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_job_per_deal
ON jobs (deal_id) WHERE status IN ('queued','running');
