-- Subscriptions: live subscription state + normalized fields
CREATE TABLE stripe_subscriptions (
  stripe_subscription_id text PRIMARY KEY,              -- Stripe subscription ID
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  status_raw text NOT NULL,                             -- raw Stripe status (e.g., 'active','past_due','canceled','incomplete',...)
  status_effective text NOT NULL CHECK (status_effective IN ('active','grace','paused','inactive')),

  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  pause_collection boolean NOT NULL DEFAULT false,

  entitlements jsonb,                                   -- mirror of stripe_prices.metadata (e.g., seats/limits)

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
