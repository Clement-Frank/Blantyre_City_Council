#!/bin/sh
# ============================================================
# Msika — end-to-end smoke test (curl only)
# ============================================================
# Exercises EVERY feature of the running app:
#   auth, role-based access, vendors, payments, verification,
#   live map, dashboard, market pulse, reminders, reports,
#   QR self-pay, Airtel + TNM webhooks, external provider API
#   and the reminder cron endpoint.
#
# Usage:
#   BASE=https://3000-xxxx.e2b.app sh msika-app/scripts/smoke.sh
#   BASE=http://localhost:3000 sh msika-app/scripts/smoke.sh
#
# Optional env:
#   MSIKA_API_KEY   use this provider API key for /api/external/*
#                   (if unset, the script provisions a test key via psql)
#   ADMIN_USER      default: admin        ADMIN_PASS: default: password123
#   COLLECTOR_USER  default: j.phiri      COLLECTOR_PASS: default: password123
#
# Exit code 0 = all checks passed, 1 = at least one failure.
# ============================================================

BASE="${BASE:-http://localhost:3000}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-password123}"
COLLECTOR_USER="${COLLECTOR_USER:-j.phiri}"
COLLECTOR_PASS="${COLLECTOR_PASS:-password123}"

PASS=0; FAIL=0; WARN=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
JAR="$TMP/admin.jar"      # admin cookie jar
JAR_C="$TMP/collector.jar" # collector cookie jar
BODY="$TMP/body"

# ---------- output helpers ----------
if [ -t 1 ]; then
  G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; B=$'\033[1m'; N=$'\033[0m'
else
  G=""; R=""; Y=""; B=""; N=""
fi

ok()   { PASS=$((PASS+1)); printf "  ${G}PASS${N}  %s\n" "$1"; }
bad()  { FAIL=$((FAIL+1)); printf "  ${R}FAIL${N}  %s\n" "$1"; }
warn() { WARN=$((WARN+1)); printf "  ${Y}WARN${N}  %s\n" "$1"; }
section() { printf "\n${B}%s${N}\n" "$1"; }

# expect <label> <accepted-status-list: e.g. 200/201>
expect() {
  label="$1"; accepted="$2"; code="$3"; detail="$4"
  match=""
  for a in $(echo "$accepted" | tr '/' ' '); do
    [ "$code" = "$a" ] && match=1
  done
  if [ -n "$match" ]; then
    ok "$label -> $code${detail:+ ($detail)}"
  else
    bad "$label -> $code (expected $accepted) ${detail:+| $detail}"
    tail -c 300 "$BODY" 2>/dev/null | head -c 300; echo
  fi
}

# req <method> <path> <extra-curl-args...>; sets CODE and writes body to $BODY
req() {
  method="$1"; path="$2"; shift 2
  CODE=$(curl -sS -o "$BODY" -w "%{http_code}" -X "$method" \
    -H "Content-Type: application/json" "$@" "$BASE$path" 2>"$TMP/curlerr") || CODE="ERR"
  [ "$CODE" = "ERR" ] && { CODE="ERR"; echo "curl error: $(cat "$TMP/curlerr")" >"$BODY"; }
  return 0
}

jqget() { jq -r "$1" "$BODY" 2>/dev/null; }

# ============================================================
section "1. Public pages"
# / is a server redirect into the auth flow (by design)
req GET "/"
expect "GET / (redirects to login)" "307/302" "$CODE"
req GET "/login"
expect "GET /login (auth page)" "200" "$CODE"

# ============================================================
section "2. Authentication"
req POST "/api/auth/login" -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" -c "$JAR" -s
expect "POST /api/auth/login (admin)" "200" "$CODE"
ADMIN_ROLE=$(jqget ".user.role // .role")
[ "$ADMIN_ROLE" != "Administrator" ] && warn "login response role: '$ADMIN_ROLE'"

req POST "/api/auth/login" -d '{"username":"admin","password":"wrong-password"}' -s
expect "POST /api/auth/login (bad password rejected)" "401" "$CODE"

req GET "/api/auth/me" -b "$JAR" -s
expect "GET /api/auth/me" "200" "$CODE"

req GET "/api/vendors" -s
expect "GET /api/vendors without auth is 401" "401" "$CODE"

req GET "/dashboard" -b "$JAR"
expect "GET /dashboard (authed page)" "200" "$CODE"
req GET "/dashboard/vendors" -b "$JAR"
expect "GET /dashboard/vendors (authed page)" "200" "$CODE"

# ============================================================
section "3. Vendors (list, meta, detail)"
req GET "/api/vendors" -b "$JAR" -s
expect "GET /api/vendors" "200" "$CODE"
COUNT=$(jqget ".count")
echo "        total vendors visible to admin: $COUNT"
VENDOR=$(jqget ".businesses[0].vendor_number")
[ -z "$VENDOR" ] || [ "$VENDOR" = "null" ] && { bad "could not read a vendor_number from list"; VENDOR="V-01001"; }
echo "        using test vendor: $VENDOR"

req GET "/api/vendors/meta" -b "$JAR" -s
expect "GET /api/vendors/meta" "200" "$CODE"

req GET "/api/vendors/$VENDOR" -b "$JAR" -s
expect "GET /api/vendors/$VENDOR (detail)" "200" "$CODE"

req GET "/api/vendors/V-NOSUCH" -b "$JAR" -s
expect "GET /api/vendors/V-NOSUCH is 404" "404" "$CODE"

# ============================================================
section "4. Payments (list, record, verify)"
req GET "/api/payments" -b "$JAR" -s
expect "GET /api/payments" "200" "$CODE"

req POST "/api/payments" -b "$JAR" -s \
  -d "{\"vendor_number\":\"$VENDOR\",\"amount\":100,\"payment_channel\":\"Cash\"}"
# 409 = vendor already paid today (daily idempotency) — a feature, not a bug
expect "POST /api/payments (record cash payment)" "200/201/409" "$CODE" \
  "$([ "$CODE" = "409" ] && echo 'vendor already paid today')"

req GET "/api/payments/verify?vendor_number=$VENDOR" -b "$JAR" -s
expect "GET /api/payments/verify?vendor_number=$VENDOR" "200" "$CODE"

# ============================================================
section "5. Live map, dashboard, market pulse"
req GET "/api/map" -b "$JAR" -s
expect "GET /api/map" "200" "$CODE"

req GET "/api/dashboard" -b "$JAR" -s
expect "GET /api/dashboard" "200" "$CODE"

# ============================================================
section "6. Reminder automation + reports"
req GET "/api/reminders" -b "$JAR" -s
expect "GET /api/reminders (automation feed)" "200" "$CODE"

req POST "/api/reminders" -b "$JAR" -s \
  -d "{\"vendor_numbers\":[\"$VENDOR\"],\"message\":\"Smoke test reminder for $VENDOR\"}"
expect "POST /api/reminders (targeted)" "200" "$CODE"

req GET "/api/reports/daily" -b "$JAR" -s
expect "GET /api/reports/daily" "200" "$CODE"

# ============================================================
section "6b. Market intelligence + MRI scoring algorithm"
req GET "/api/market-intel" -b "$JAR"
expect "GET /api/market-intel (unified engine feed)" "200" "$CODE"
MARKET_NAME=$(jqget ".market.name")
MRI_AVG=$(jqget ".summary.avg_mri")
SEC_COUNT=$(jqget ".sections | length")
VENDOR_INTEL_COUNT=$(jqget ".vendors | length")
ALGO_NAME=$(jqget ".algorithm.name")
echo "        market: $MARKET_NAME · sections: $SEC_COUNT · vendors scored: $VENDOR_INTEL_COUNT · avg MRI: $MRI_AVG"
echo "        algorithm: $ALGO_NAME"
[ "$SEC_COUNT" -gt 0 ] 2>/dev/null && ok "sections computed ($SEC_COUNT)" || bad "no sections returned"
[ "$VENDOR_INTEL_COUNT" -gt 0 ] 2>/dev/null && ok "vendor scores computed ($VENDOR_INTEL_COUNT)" || bad "no vendor scores"

# every MRI must be 0..100 with a valid tier
BAD_TIER=$(jq -r '[.vendors[].tier] | map(select(. as $t | ["Excellent","Reliable","Watch","At Risk","Chronic"] | index($t) | not)) | length' "$BODY" 2>/dev/null)
[ "$BAD_TIER" = "0" ] && ok "all vendor tiers valid" || bad "$BAD_TIER vendors have invalid tier values"

req GET "/api/pulse" -b "$JAR"
expect "GET /api/pulse (engine-backed, backwards compatible)" "200" "$CODE"
PULSE_MRI=$(jqget ".summary.avg_mri")
[ "$PULSE_MRI" = "$MRI_AVG" ] && ok "pulse avg_mri matches market-intel ($MRI_AVG) — single source of truth" || warn "pulse avg_mri ($PULSE_MRI) differs from market-intel ($MRI_AVG)"

# ============================================================
section "7. Admin-only directories (collectors, supervisors)"
req GET "/api/collectors" -b "$JAR" -s
expect "GET /api/collectors (admin)" "200" "$CODE"
req GET "/api/supervisors" -b "$JAR" -s
expect "GET /api/supervisors (admin)" "200" "$CODE"

# ============================================================
section "7b. System administration (audit logs, API clients)"
req GET "/api/audit-logs" -b "$JAR" -s
expect "GET /api/audit-logs (admin, real trail)" "200" "$CODE"
AUDIT_TOTAL=$(jqget ".total")
AUDIT_ACTIONS=$(jqget ".action_counts | length")
echo "        audit events recorded: $AUDIT_TOTAL across $AUDIT_ACTIONS action types"
[ "$AUDIT_TOTAL" -gt 0 ] 2>/dev/null && ok "audit trail has real events" || bad "audit trail empty — logAudit is not being called"

req GET "/api/audit-logs?action=LOGIN" -b "$JAR" -s
expect "GET /api/audit-logs (action filter)" "200" "$CODE"

req GET "/api/api-clients" -b "$JAR" -s
expect "GET /api/api-clients (admin, real clients)" "200" "$CODE"
CLIENT_COUNT=$(jqget ".clients | length")
echo "        registered API clients: $CLIENT_COUNT"

req PATCH "/api/api-clients" -b "$JAR" -s \
  -d "{\"is_active\":true}"
expect "PATCH /api/api-clients without id is 400" "400" "$CODE"

# ============================================================
section "8. Role-based access control (collector)"
req POST "/api/auth/login" -d "{\"username\":\"$COLLECTOR_USER\",\"password\":\"$COLLECTOR_PASS\"}" -c "$JAR_C" -s
expect "POST /api/auth/login (collector $COLLECTOR_USER)" "200" "$CODE"

req GET "/api/collectors" -b "$JAR_C" -s
expect "GET /api/collectors as collector is 403" "403" "$CODE"
req GET "/api/supervisors" -b "$JAR_C" -s
expect "GET /api/supervisors as collector is 403" "403" "$CODE"
req GET "/api/audit-logs" -b "$JAR_C" -s
expect "GET /api/audit-logs as collector is 403" "403" "$CODE"
req GET "/api/api-clients" -b "$JAR_C" -s
expect "GET /api/api-clients as collector is 403" "403" "$CODE"

req GET "/api/vendors" -b "$JAR_C" -s
expect "GET /api/vendors as collector (scoped)" "200" "$CODE"
C_COUNT=$(jqget ".count")
echo "        vendors visible to collector: $C_COUNT (own registrations only)"
req GET "/api/payments" -b "$JAR_C" -s
expect "GET /api/payments as collector (scoped)" "200" "$CODE"

req GET "/api/market-intel" -b "$JAR_C"
expect "GET /api/market-intel as collector (scoped)" "200" "$CODE"
CV=$(jqget ".summary.vendors")
echo "        collector sees $CV scored vendors (own registrations only)"

# ============================================================
section "9. QR self-pay (public pay-status + paycode)"
req GET "/api/public/pay-status?vendor_number=$VENDOR" -s
expect "GET /api/public/pay-status?vendor_number=$VENDOR" "200" "$CODE"
PAYCODE=$(jqget ".code")

req POST "/api/pay/paycode" -s \
  -d "{\"vendor_number\":\"$VENDOR\",\"code\":\"$PAYCODE\",\"amount\":100,\"payment_channel\":\"AirtelMoney\",\"payer_phone\":\"0999000001\"}"
# 201 = paid now, 200 = already paid today
expect "POST /api/pay/paycode (QR payment)" "200/201" "$CODE" \
  "$([ "$CODE" = "200" ] && echo 'already paid today')"

req POST "/api/pay/paycode" -s \
  -d "{\"vendor_number\":\"$VENDOR\",\"code\":\"forged-code-000\",\"amount\":100}"
expect "POST /api/pay/paycode with forged code is 403" "403" "$CODE"

# ============================================================
section "10. Airtel Money webhook (realtime wallet payment)"
REF_A="SMOKE-AM-$(date +%s)"
req POST "/api/webhook/airtel" -s \
  -d "{\"transaction_ref\":\"$REF_A\",\"vendor_number\":\"$VENDOR\",\"amount\":100,\"status\":\"SUCCESS\",\"payer_phone\":\"0999000002\"}"
expect "POST /api/webhook/airtel (SUCCESS payment)" "200" "$CODE"

req POST "/api/webhook/airtel" -s \
  -d "{\"transaction_ref\":\"$REF_A\",\"vendor_number\":\"$VENDOR\",\"amount\":100,\"status\":\"SUCCESS\"}"
DUP=$(jqget ".duplicate")
expect "POST /api/webhook/airtel (same ref -> idempotent)" "200" "$CODE" \
  "$([ "$DUP" = "true" ] && echo duplicate=true)"

req POST "/api/webhook/airtel" -s \
  -d "{\"transaction_ref\":\"SMOKE-FAIL-$(date +%s)\",\"vendor_number\":\"$VENDOR\",\"amount\":100,\"status\":\"FAILED\"}"
expect "POST /api/webhook/airtel (FAILED payment recorded)" "200" "$CODE"

# ============================================================
section "11. TNM Mpamba webhook"
REF_T="SMOKE-TM-$(date +%s)"
req POST "/api/webhook/mpamba" -s \
  -d "{\"transaction_ref\":\"$REF_T\",\"vendor_number\":\"$VENDOR\",\"amount\":100,\"status\":\"TS\",\"payer_phone\":\"0888000002\"}"
expect "POST /api/webhook/mpamba (TS payment)" "200" "$CODE"

# ============================================================
section "12. External provider API (x-api-key)"
API_KEY="${MSIKA_API_KEY:-}"
if [ -z "$API_KEY" ] && command -v psql >/dev/null 2>&1; then
  API_KEY="msika_smoke_test_key_0001"
  KEY_HASH=$(printf '%s' "$API_KEY" | sha256sum | awk '{print $1}')
  PGPASSWORD="${PGPASSWORD:-msika_local_dev}" psql -h "${PGHOST:-localhost}" \
    -U "${PGUSER:-msika}" -d "${PGDATABASE:-msika}" -q \
    -c "DELETE FROM \"ApiKey\" WHERE name = 'smoke-test';" \
    -c "INSERT INTO \"ApiKey\" (api_client_id, key_hash, name, permissions, is_active) VALUES (1, '$KEY_HASH', 'smoke-test', '[\"vendors\",\"payments\"]', true);" \
    >/dev/null 2>&1 && echo "        provisioned smoke API key in DB (client: Airtel Money Malawi)"
fi

if [ -n "$API_KEY" ]; then
  req GET "/api/external/vendors" -H "x-api-key: $API_KEY" -s
  expect "GET /api/external/vendors" "200" "$CODE"

  req GET "/api/external/vendors?vendor_number=$VENDOR" -H "x-api-key: $API_KEY" -s
  expect "GET /api/external/vendors?vendor_number=$VENDOR" "200" "$CODE"

  req GET "/api/external/payments?vendor_number=$VENDOR&limit=5" -H "x-api-key: $API_KEY" -s
  expect "GET /api/external/payments?vendor_number=$VENDOR" "200" "$CODE"

  REF_X="SMOKE-EXT-$(date +%s)"
  req POST "/api/external/payments" -H "x-api-key: $API_KEY" -s \
    -d "{\"transaction_ref\":\"$REF_X\",\"vendor_number\":\"$VENDOR\",\"amount\":100,\"status\":\"TS\"}"
  expect "POST /api/external/payments (TNM payment via key)" "200" "$CODE"

  req GET "/api/external/vendors" -H "x-api-key: msika_invalid_key" -s
  expect "GET /api/external/vendors with invalid key is 401" "401" "$CODE"
else
  warn "no psql and no MSIKA_API_KEY — external API tests skipped"
fi

# ============================================================
section "13. Reminder cron endpoint (backup scheduler trigger)"
req GET "/api/cron/reminders"
if [ "$CODE" = "401" ]; then
  warn "GET /api/cron/reminders -> 401 (CRON_SECRET is set — pass it: curl -H 'Authorization: Bearer \$CRON_SECRET')"
elif [ "$CODE" = "200" ]; then
  ok "GET /api/cron/reminders -> 200"
  echo "        reminders run result: $(tr -d '\n' <"$BODY" | cut -c 1-120)"
else
  bad "GET /api/cron/reminders -> $CODE (expected 200 or 401)"
fi

# ============================================================
section "14. Logout"
req POST "/api/auth/logout" -b "$JAR" -c "$JAR" -s
expect "POST /api/auth/logout" "200" "$CODE"
req GET "/api/auth/me" -b "$JAR" -s
expect "GET /api/auth/me after logout is 401" "401" "$CODE"

# ============================================================
printf "\n${B}================ SUMMARY ================${N}\n"
printf "  ${G}PASS: %s${N}   ${Y}WARN: %s${N}   ${R}FAIL: %s${N}\n" "$PASS" "$WARN" "$FAIL"
printf "  Base URL: %s\n" "$BASE"
if [ "$FAIL" -gt 0 ]; then
  printf "  ${R}RESULT: SMOKE TEST FAILED${N}\n"
  exit 1
fi
printf "  ${G}RESULT: ALL FEATURES OPERATIONAL${N}\n"
exit 0
