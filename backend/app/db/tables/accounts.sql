-- Accounts table: entity that holds a subscription
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('user', 'org')),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Enforce uniqueness for user-accounts
  CONSTRAINT unique_user_account UNIQUE (user_id)
);
