CREATE TABLE IF NOT EXISTS om_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  om_upload_file_id uuid NOT NULL REFERENCES upload_files(id) ON DELETE CASCADE,
  classification jsonb NOT NULL,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (om_upload_file_id)
);

-- indexes you'll actually use
CREATE INDEX IF NOT EXISTS idx_om_classifications_deal ON om_classifications (deal_id);
CREATE INDEX IF NOT EXISTS idx_om_classifications_omfile ON om_classifications (om_upload_file_id);
