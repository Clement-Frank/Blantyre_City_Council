-- Msika database hardening: performance indexes, reporting view,
-- and webhook idempotency.

-- ===== Performance indexes on hot query paths =====
CREATE INDEX IF NOT EXISTS "Payment_business_paid_status_idx"
  ON "Payment" ("business_id", "paid_at", "status");

CREATE INDEX IF NOT EXISTS "Payment_paid_at_status_idx"
  ON "Payment" ("paid_at", "status");

CREATE INDEX IF NOT EXISTS "Payment_created_at_idx"
  ON "Payment" ("created_at");

CREATE INDEX IF NOT EXISTS "Payment_channel_idx"
  ON "Payment" ("payment_channel");

CREATE INDEX IF NOT EXISTS "Business_market_status_idx"
  ON "Business" ("market_id", "status");

CREATE INDEX IF NOT EXISTS "Business_section_idx"
  ON "Business" ("section_id");

CREATE INDEX IF NOT EXISTS "Notification_recipient_idx"
  ON "Notification" ("recipient_type", "recipient_id", "created_at");

CREATE INDEX IF NOT EXISTS "Notification_channel_created_idx"
  ON "Notification" ("channel", "created_at");

CREATE INDEX IF NOT EXISTS "RevenueSummary_date_idx"
  ON "RevenueSummary" ("summary_date");

-- ===== Daily revenue rollup view (fast reports) =====
CREATE OR REPLACE VIEW "vw_daily_revenue" AS
SELECT b.market_id,
       p.paid_at::date AS payment_date,
       SUM(p.amount)   AS total_amount,
       COUNT(*)        AS total_transactions,
       SUM(CASE WHEN p.payment_channel = 'Cash' THEN 1 ELSE 0 END)  AS cash_count,
       SUM(CASE WHEN p.payment_channel <> 'Cash' THEN 1 ELSE 0 END) AS wallet_count
FROM "Payment" p
JOIN "Business" b ON b.business_id = p.business_id
WHERE p.status = 'Completed'
GROUP BY b.market_id, p.paid_at::date;

-- ===== Webhook idempotency: reject duplicate provider transactions =====
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_ref_unique"
  ON "Payment" ("provider_ref")
  WHERE "provider_ref" IS NOT NULL;
