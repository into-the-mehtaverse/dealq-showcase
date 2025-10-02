-- Stripe Invoices: cache of invoice history for subscriptions
CREATE TABLE stripe_invoices (
  stripe_invoice_id text PRIMARY KEY,                       -- Stripe invoice ID
  stripe_subscription_id text
    REFERENCES stripe_subscriptions(stripe_subscription_id) ON DELETE CASCADE,
  status text NOT NULL,                                     -- raw Stripe status (e.g. 'draft','open','paid','uncollectible','void')
  amount_due integer NOT NULL,                              -- stored in cents
  amount_paid integer NOT NULL,                             -- stored in cents
  hosted_invoice_url text,                                  -- Stripe-hosted URL
  created_at timestamptz NOT NULL DEFAULT now()
);
