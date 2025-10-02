-- Stripe Customers (1:1 with accounts)
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text NOT NULL UNIQUE,
  billing_email text,
  default_payment_method_last4 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
