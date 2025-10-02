-- Users table with organization relationship
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  organization_id uuid REFERENCES organizations(id), -- Each user belongs to an organization
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
