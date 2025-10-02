# Stripe Webhook Implementation Order

This document outlines the launch-version webhook events we listen to,
the purpose of each, and which tables they update in our billing schema.

---

## 1. `checkout.session.completed`
**Purpose:** Link Stripe Customer to our `account_id`.
**Notes:** Do **not** grant access here.
**Tables touched:**
- `stripe_customers` (upsert `account_id` ↔ `stripe_customer_id`)
- `stripe_webhook_events` (log raw event)

---

## 2. `customer.subscription.created`
**Purpose:** Create a new subscription entry.
**Notes:** First place we grant access. Snapshot plan metadata.
**Tables touched:**
- `stripe_subscriptions` (insert new row with status, entitlements, period dates)
- `stripe_webhook_events`

---

## 3. `customer.subscription.updated`
**Purpose:** Handle plan changes, proration, pauses, seat changes.
**Notes:** Recompute `status_effective`, refresh entitlements if price changed.
**Tables touched:**
- `stripe_subscriptions` (update existing row)
- `stripe_webhook_events`

---

## 4. `customer.subscription.deleted`
**Purpose:** Cancel subscription and remove access.
**Notes:** Immediate cancel → inactive; scheduled → inactive after `current_period_end`.
**Tables touched:**
- `stripe_subscriptions` (update `status_effective = inactive`)
- `stripe_webhook_events`

---

## 5. `invoice.finalized`
**Purpose:** Record invoice history.
**Notes:** Good place to reconcile prices against cache.
**Tables touched:**
- `stripe_invoices` (insert or update row)
- `stripe_webhook_events`

---

## 6. `invoice.paid`
**Purpose:** Mark billing cycle as paid.
**Tables touched:**
- `stripe_invoices` (update `status = 'paid'`, set `amount_paid`)
- `stripe_webhook_events`

---

## Later (Not in MVP)
- `invoice.payment_failed` → flip to `grace` or `inactive`

---

# Implementation Order

1. **Plumbing & Idempotency**
   - Create `stripe_webhook_events`
   - Central webhook endpoint verifies signature, logs event, branches by type

2. **Customer linkage**
   - Implement `checkout.session.completed` → upsert `stripe_customers`

3. **Core subscription lifecycle**
   - Implement `customer.subscription.created`
   - Implement `customer.subscription.updated`
   - Implement `customer.subscription.deleted`

4. **Invoice history**
   - Implement `invoice.finalized`
   - Implement `invoice.paid`

5. **Hardening (later)**
   - Add `invoice.payment_failed`
   - Add `stripe_price_id` column to `subscriptions` for traceability
   - Create `account_entitlements` view for simplified access control
   - Add update of stripe_subscriptions to invoice.paid handler for subs in grace.
