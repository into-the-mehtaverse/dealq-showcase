# DealQ Subscription Model (Future-Proofed)

## 1. accounts (the billing subject)
**Purpose:** Entity that holds a subscription.
- Today: one account per user.
- Later: also allow org accounts.

**Columns (core):**
- id (PK)
- type ENUM: `user | org`
- user_id (FK → users, nullable; used when type='user')
- owner_user_id (FK → users) — who can manage billing
- created_at, updated_at

**Constraints:**
- Uniqueness: `(type='user', user_id)` unique
- Later: `(type='org', org_id)` unique

➡️ Subscriptions always point to `account_id`, not `user_id`. This is the forward-compatibility story.

eventually we'll add org accounts and then - org_id (FK → organizations, nullable; used when type='org')
but for now we're keeping it simple
---

## 2. stripe_customers (Stripe customer cache)
**Columns:**
- account_id (FK → accounts, unique)
- stripe_customer_id (unique)
- optional: billing_email, default_payment_method_last4, etc.

---

## 3. stripe_prices (Stripe price cache)
**Columns:**
- stripe_price_id (PK)
- stripe_product_id
- nickname
- unit_amount
- currency
- interval
- metadata JSON (e.g. `{ "tier": "pro", "seats": "1", "limits": { "files": 100 } }`)

---

## 4. stripe_subscriptions
**Columns:**
- stripe_subscription_id (PK)
- account_id (FK → accounts)
- status_raw (Stripe)
- status_effective ENUM: `active | grace | paused | inactive`
- cancel_at_period_end BOOL
- current_period_start (timestamptz)
- current_period_end (timestamptz)
- trial_start (timestamptz)
- trial_end (timestamptz)
- pause_collection BOOL
- entitlements JSON (copy from prices.metadata, possibly seat count)
- updated_at

We currently don't offer trials but we'll keep the columns there in case we do.
---

## 5. stripe_invoices (optional but handy)
**Columns:**
- stripe_invoice_id (PK)
- stripe_subscription_id (FK)
- status
- amount_due
- amount_paid
- hosted_invoice_url
- created_at

Meant for tracking billing history and details
---

## 6. stripe_webhook_events
**Columns:**
- stripe_event_id (unique)
- type
- payload JSONB
- processed_at
- status
- error_message

this is how we are going to handle idempotency for the webhook for now

Below is the list of webhook events we're going to build for.

Must-listen webhook events (launch version)
1. checkout.session.completed
Link the Stripe Customer to your account_id (create/update customers row).
Don’t grant access here; just make sure you have stripe_customer_id.
2. customer.subscription.created
Upsert into subscriptions (+ subscription_items).
Mirror price.metadata → subscriptions.entitlements snapshot.
Set status_effective (active/trialing → active).
3. customer.subscription.updated
Handle plan changes, proration, cancel_at_period_end, pause_collection, period dates.
Recompute status_effective.
Refresh entitlements if price changed; update seat count from item quantity.
4. customer.subscription.deleted
Immediate cancel: mark status_effective = inactive.
If scheduled, flip to inactive when current_period_end passes.
5. invoice.finalized
Upsert into invoices.
Good place to reconcile subscription price(s) vs. your cache.
6. invoice.paid
Mark latest billing cycle as paid

We'll add invoice.payment_failed later but for now don't worry about.
