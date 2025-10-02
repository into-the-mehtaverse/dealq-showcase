-- Stripe Prices (cache of Stripe Price objects)
CREATE TABLE stripe_prices (
  stripe_price_id text PRIMARY KEY,
  stripe_product_id text NOT NULL,
  nickname text,
  unit_amount integer NOT NULL,      -- stored in cents
  currency text NOT NULL,            -- e.g. 'usd'
  interval text NOT NULL,            -- e.g. 'month', 'year'
  metadata jsonb,                    -- e.g. {"tier":"pro","seats":"1","limits":{"files":100}}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
