-- Stripe Webhook Events: raw event store + idempotency handling
CREATE TABLE stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,            -- Stripe's event ID
  type text NOT NULL,                              -- e.g. 'invoice.payment_succeeded'
  payload jsonb NOT NULL,                          -- full Stripe payload
  processed_at timestamptz,                        -- when we handled the event
  status text NOT NULL DEFAULT 'pending',          -- 'pending' | 'processed' | 'failed'
  error_message text,                              -- optional error info
  created_at timestamptz NOT NULL DEFAULT now()
);
