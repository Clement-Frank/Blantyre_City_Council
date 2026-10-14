# Msika — API Test Suite & Feature Audit

Base URL: `http://localhost:3000`
Source of truth: this repo's code as inspected (routes in `app/api/**`, logic in `lib/**`, schema in `prisma/schema.prisma`).
Everything below reflects ONLY what actually exists in the code. No invented endpoints.

---

## 0. How it all hangs together (read me first — 60 seconds)

**Authentication is a session cookie, not a token header.**
`POST /api/auth/login` verifies the username+password (bcrypt) across three staff tables
(`User`/admin, `Collector`, `Supervisor`), then sets an **httpOnly cookie named `token`**
(JWT HS256, signed with `JWT_SECRET`, expires in **8 hours**).
Every protected endpoint reads that cookie. In cURL you just save the cookie into a jar
file with `-c` and send it back with `-b`. Never handle a raw token.

**Roles** come straight from the login: `Administrator` (from `User` table),
`Collector`, `Supervisor`. There is **no Vendor role and no vendor account anywhere** —
this is the single most important finding of this audit.

**RBAC scoping** (lib/permissions.ts):
- Administrator → everything
- Supervisor → data in their sub-office's markets
- Collector → sees all vendors (for collection), but payment *details* only for payments they recorded
- No session → 401

**Wallet payments are SIMULATED, not real.** There is no Airtel Money / TNM Mpamba
API client in the code. The system *accepts* wallet transactions in two ways:
1. Staff record a wallet payment → status **Pending**; later a "provider webhook"
   (`/api/webhook/airtel`, `/api/webhook/mpamba`, or the API-key'd
   `/api/external/payments`) flips it to Completed/Failed.
2. The QR **pay-code** endpoint `/api/pay/paycode` creates a **Completed** wallet
   payment directly (it trusts the caller after validating a signed pay-code).

Both consume webhook-shaped requests — for testing you send the "webhook" yourself.
These are simulations. **They are not real mobile-money transactions.**

---

## 1. STEP 1 — Complete endpoint inventory (all verified in code)

### Auth (cookie JWT, 8h)
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 1 | POST | `/api/auth/login` | none | All staff roles. Sets `token` cookie |
| 2 | POST | `/api/auth/logout` | none | Clears cookie |
| 3 | GET | `/api/auth/me` | cookie | `verifyToken`; 401 without/with invalid token |

### Vendors
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 4 | GET | `/api/vendors` | cookie | list, `?search=`, `?market_id=`, paid_today flag |
| 5 | POST | `/api/vendors` | cookie | register; **Collector → 403**; geofences coords |
| 6 | GET | `/api/vendors/{vendor_number\|business_id}` | cookie | profile; payments scoped by role |
| 7 | GET | `/api/vendors/meta` | cookie | business types + fees, markets + sections |

### Payments
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 8 | GET | `/api/payments` | cookie | list; `?status=`, `?search=`, `?limit=`; scoped |
| 9 | POST | `/api/payments` | cookie | record payment. Collector: **Cash only (403 otherwise)**; amount must equal vendor's fee (400); duplicate-today → **409**; Cash→Completed, wallet→**Pending** |
| 10 | GET | `/api/payments/verify` | cookie | `?vendor_number=`; profile, paid_today, today_payment, **last-10 history** |

### Public (no login — QR flow)
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 11 | GET | `/api/public/pay-status` | none | `?vendor_number=`; minimal stall info, fee, paid_today, **returns the vendor's pay-code** |
| 12 | POST | `/api/pay/paycode` | none* | body `{vendor_number, code, amount, payment_channel, payer_phone?}`; validates pay-code against JWT_SECRET hash; creates **Completed** wallet payment (simulated); idempotent per day |

### Map / Dashboard / Reports
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 13 | GET | `/api/map` | cookie | red/green from DB (`paid_today` = Completed today); `?filter=paid\|unpaid`; boundary + stats |
| 14 | GET | `/api/dashboard` | cookie | vendor counts, paid/unpaid today, revenue today/yesterday/month (**Completed only**), failed count, sections — *does NOT split cash vs wallet* |
| 15 | GET | `/api/reports/daily` | cookie | `?date=YYYY-MM-DD`; totals, **channels split (Cash/AirtelMoney/TNMMpamba)**, fee types, sections |

### Admin-only
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 16 | GET/POST/PATCH | `/api/api-clients` | **Administrator only** | register API clients, mint keys only at creation |
| 17 | GET | `/api/audit-logs` | **Administrator only** | `?action=`, `?search=`, `?limit=` |
| 18 | GET/POST | `/api/collectors` | Administrator | collector accounts |
| 19 | GET/POST/DELETE | `/api/supervisors` | Administrator | POST creates, DELETE soft-deactivates `?id=` |
| 20 | GET | `/api/markets` | admin **and** supervisor read | list w/ sections |
| 21 | POST | `/api/markets` | Administrator | create market `{name, sub_office_id, location?}` or section `{market_id, section_name}` |

### Notifications & ops
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 22 | GET | `/api/reminders` | cookie | today's unpaid vendors + last 30 notifications |
| 23 | POST | `/api/reminders` | cookie | `{vendor_numbers?[], message?}` → SMS (Twilio if keys, else "Logged" only) |
| 24 | GET | `/api/market-intel` | cookie | market analytics + MRI vendor scores |
| 25 | GET | `/api/pulse` | cookie | same data, kept for compatibility |
| 26 | GET/POST | `/api/cron/reminders` | `CRON_SECRET` bearer (skipped in dev) | Vercel cron |

### External API (Airtel/TNM providers) — `x-api-key` header
| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|
| 27 | GET | `/api/external/vendors` | x-api-key | `?vendor_number=` single incl. paid_today |
| 28 | GET | `/api/external/payments` | x-api-key | `?vendor_number=`, `?limit=` |
| 29 | POST | `/api/external/payments` | x-api-key | submit wallet payment (webhook body) |
| 30 | POST | `/api/webhook/airtel` | **none** ⚠️ | same body; **no signature verification — flagged below** |
| 31 | POST | `/api/webhook/mpamba` | **none** ⚠️ | same body; **no signature verification — flagged below** |

---

## 2. STEP 2 — Implemented / partial / missing

| Ask | Verdict |
|-----|---------|
| Public vendor self-registration | **NOT IMPLEMENTED.** `POST /api/vendors` requires login and rejects Collectors. No public registration endpoint exists. |
| Unique Vendor ID generation | **IMPLEMENTED** — `V-XXXXX` random, `@unique` in DB, retry-then-timestamp fallback. |
| Vendor duplicate protection | **PARTIAL** — vendor_number is always unique (it's generated), but there is **no dedupe on phone/national_id**: the same person can register twice. |
| Coordinate boundary check | **PARTIAL** — `checkGeofence()` computes inside/outside but the endpoint **never rejects**; points outside are *snapped* inside the fence silently. Response includes honest `geofence.inside` info. |
| Vendor authentication / self-service | **NOT IMPLEMENTED.** No vendor credential/ID login. Closest substitutes: public `/api/public/pay-status`, staff `/api/payments/verify`, vendor profile page. |
| Airtel/TNM real integration | **NOT IMPLEMENTED.** Webhook-driven **simulation** only. |
| Wallet payment initiation + ref + Pending | **IMPLEMENTED** (POST /api/payments → Pending, ref `AM-…`/`TM-…`). |
| Wallet confirmation | **IMPLEMENTED** (webhook/external endpoints → Completed/Failed, `provider_ref` stored). |
| Duplicate payment prevention | **PARTIAL** — POST /api/payments is idempotent per vendor/day (409) and `transaction_ref` is unique, but the **webhook path does not check already-paid-today** (only ref dupes → could double-count a same-day wallet payment under different refs). |
| Receipts | **PARTIAL** — receipt SMS text auto-generated (Twilio if configured, else `Notification` row with status "Logged"), but there is **no GET endpoint to retrieve a receipt**; `Payment.receipt_generated` exists in schema but is never set anywhere. |
| Cash flow with collector attribution | **IMPLEMENTED** — collector_id from session, `paid_at` timestamp, status Completed, audit + receipt. |
| Map from DB, red/green | **IMPLEMENTED** — derives from `status=Completed`, `paid_at ≥ today`. |
| Collection-period-aware map | **NOT IMPLEMENTED** — map is hard-wired to "today". Reports/daily accepts a date; the map doesn't. |
| Dashboard per spec | **PARTIAL** — totals, paid/unpaid, confirmed-only revenue all correct; but **cash vs wallet split lives only in /api/reports/daily**, not on the dashboard. |
| Fee-rate management UI/API | **NOT IMPLEMENTED** — fees exist as seeded `BusinessType.fee_amount`; no CRUD endpoint to change them. |
| Audit logging | **IMPLEMENTED** for login, vendor CREATE, payments (incl. wallet webhooks with actor "ApiClient"); admin-only read. Log-out and key-rotation events not audited. |
| Webhook authenticity | **NOT IMPLEMENTED** — `/api/webhook/airtel|mpamba` accept **unsigned** JSON from anyone. The `/api/external/*` variants ARE protected by x-api-key. Fix: point providers at `/api/external/payments` or add signature checks. |

---

## 3. STEP 0 — Start the server

```bash
# 1. Dependencies + local DB (first time only; requires DATABASE_URL + JWT_SECRET in msika-app/.env)
cd msika-app
npx prisma migrate dev      # create/update schema
npx prisma db seed          # seeds test data; prints the seeded test credentials

# 2. Start the dev server (port 3000 by default)
npm run dev
# Codespaces note: open the forwarded port or use
#   BASE_URL=$(gp env get CODESPACE_URL 2>/dev/null || echo http://localhost:3000)
```

Test data seeded by `prisma/seed.ts` (all of it is test data — safe to use):
- Council: Blantyre City Council → Sub-office: Limbe Sub Office → Market: **Limbe Market (`market_id: 1`)**
- Sections 1–6: Vegetables(1) Fish(2) Textiles(3) Hardware(4) Groceries(5) Restaurants(6)
- Business types: 1 Market Vendor **MWK 300**, 2 Kupikulisa Bulk **2000**, 3 Restaurant **500**, 4 Butchery **500**
- Seeded vendors: `V-01001` … (4-digit padded)
- Test accounts: `admin` (Administrator), `j.phiri`, `a.banda` (Collectors), `m.banda` (Supervisor) — passwords are the seeded test passwords printed by the seed script (do not reuse anywhere real).

Confirm the IDs above yourself before relying on them:

```bash
COOKIE_JAR=admin.jar
curl -s -c "$COOKIE_JAR" -H 'Content-Type: application/json' \
  -d '{"username":"<admin test username>","password":"<seeded test password>"}' \
  "$BASE_URL/api/auth/login"
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/meta"
# → types: [{business_type_id:1, fee_amount:300,…}], markets with sections
```

---

## 4. Shared shell setup (put at the top of your test script)

```bash
#!/usr/bin/env bash
# test-msika.sh — run all tests in order. GitHub Codespaces / plain bash compatible.
set -uo pipefail            # NO set -e: we *expect* some calls to fail and want to see them

BASE_URL="http://localhost:3000"
JQ() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
# (no jq dependency; JQ '.vendor_number' extracts fields)

# ---- cookie jars (the 'token' httpOnly cookie) ------------------------------
curl -s -c A.jar -H 'Content-Type: application/json' \
  -d '{"username":"<admin test username>","password":"<seeded test password>"}' \
  "$BASE_URL/api/auth/login" >/dev/null            # Administrator jar
curl -s -c C.jar -H 'Content-Type: application/json' \
  -d '{"username":"<collector test username>","password":"<seeded test password>"}' \
  "$BASE_URL/api/auth/login" >/dev/null            # Collector jar
curl -s -c S.jar -H 'Content-Type: application/json' \
  -d '{"username":"<supervisor test username>","password":"<seeded test password>"}' \
  "$BASE_URL/api/auth/login" >/dev/null            # Supervisor jar

# reusable cluster of "same" vendors we register today is stored in OUT.txt
```

For the DB check, the credential is already in msika-app/.env, so nothing is exposed here:

```bash
cd msika-app && set -a && source .env && set +a && cd ..
psql "$DATABASE_URL" -c 'SELECT ...'   # example only; full queries listed per-test
```

---

## 5. TEST 1 — Vendor self-registration

### 1a. Prove NO public registration exists
```bash
# No auth cookie on purpose. If a public endpoint existed, this would be 200/201.
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/api/vendors" \
  -H 'Content-Type: application/json' \
  -d '{"business_name":"Self-Reg Test","owner_name":"Unknown Person","phone_number":"0999000001","market_id":1,"business_type_id":1}'
```
- **Expected: `401`** ("Unauthorized"), body `{"error":"Unauthorized"}`.
- What this proves: the ONLY registration endpoint requires an authenticated **Administrator or Supervisor**. There is no vendor self-registration.
- What failure would mean: if you get 200/201 here, registration was left unauthenticated — that would be a security hole, not a feature.

Also shows there is no 403 (role-gate) without a session — auth itself is the first gate.

### 1b. Registration as Administrator (the supported path) — full fields incl. GPS
```bash
curl -s -b A.jar -H 'Content-Type: application/json' -X POST "$BASE_URL/api/vendors" \
  -d '{
    "business_name": "Chimwemwe Groceries TEST", "owner_name": "Test Owner",
    "phone_number": "0999777001", "national_id": "TEST-9999",
    "section_id": 5,                       # Groceries
    "market_id": 1, "business_type_id": 1, # Market Vendor, MWK 300
    "block": "B", "stall_number": "T-01",
    "gps_latitude": -15.8195, "gps_longitude": 35.0532,   # inside Limbe fence
    "preferred_wallet": "AirtelMoney", "wallet_number": "0999777001"
  }' | tee /tmp/v1.json
VENDOR1=$(JQ 'str(d["vendor_number"])' < /tmp/v1.json 2>/dev/null || cat /tmp/v1.json | sed -n 's/.*"vendor_number":"\([^"]*\)".*/\1/p')
echo "new vendor id = $VENDOR1"
```
- **Expected: `201`/`200`** with `{success:true, business:{…}, vendor_number:"V-NNNNN", location:{…source:"gps"}, geofence:{inside:true,…}}`
- Verifies: unique Vendor ID generated; all your listed fields accepted; DB row created.

### 1c. Required-field validation
```bash
curl -s -w '\n%{http_code}\n' -b A.jar -H 'Content-Type: application/json' -X POST \
  "$BASE_URL/api/vendors" -d '{"business_name":"only name"}'
```
- Expected **400** `{"error":"business_name, owner_name, phone_number, market_id and business_type_id are required"}`.

### 1d. Collector cannot register (RBAC)
```bash
curl -s -w '\n%{http_code}\n' -b C.jar -X POST "$BASE_URL/api/vendors" \
  -H 'Content-Type: application/json' \
  -d '{"business_name":"X","owner_name":"Y","phone_number":"0999000009","market_id":1,"business_type_id":1}'
```
- Expected **403** `Collectors cannot register vendors — ask your supervisor`.

### 1e. Duplicate registration — know exactly what is and isn't protected
```bash
# Re-register with the same owner/phone: succeeds (new vendor_number) → NOT deduped
curl -s -w '\n%{http_code}\n' -b A.jar -H 'Content-Type: application/json' -X POST \
  "$BASE_URL/api/vendors" \
  -d '{"business_name":"Chimwemwe Groceries TEST","owner_name":"Test Owner","phone_number":"0999777001","market_id":1,"business_type_id":1,"section_id":5}'
```
- Expected: another 200 with a **different** vendor_number. This is the documented "partial" duplicate gap.

### 1f. Registering lookups: does it appear in list / DB / map?
```bash
curl -s -b A.jar "$BASE_URL/api/vendors?search=Chimwemwe" | grep -o "$VENDOR1"
```
DB:
```bash
psql "$DATABASE_URL" -c "SELECT vendor_number, business_name, gps_lat..., registration_date FROM \"Business\" WHERE business_name LIKE 'Chimwemwe%';"
```
**TEST 1 verdict: NOT IMPLEMENTED (self-service path); staff-assisted path: PASS.**
Missing to enable the spec's self-registration: a public `POST /api/vendors/register` with
its own rate-limit + phone/NID dedupe, boundary *validation* (reject-and-return-error, not
snap), and a vendor-facing status page keyed by the generated Vendor ID.

---

## 6. TEST 2 — Vendor login / identification

### 2a. Prove no vendor login exists
```bash
# /api/auth/login searches ONLY User/Collector/Supervisor tables.
curl -s -w '\n%{http_code}\n' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"V-01001","password":"anything"}'
```
- Expected **401** — there is no vendor credential, so a Vendor ID is never a login.
- What a vendor CAN do without an account (two public substitutes):

### 2b. Public pay-status (real, exists) — "identifies" themselves by Vendor ID
```bash
curl -s "$BASE_URL/api/public/pay-status?vendor_number=V-01001"
# → { vendor_number, business_name, owner_name, market, fee, paid_today, code }
SAVE_CODE=$(curl -s "$BASE_URL/api/public/pay-status?vendor_number=V-01001" | sed -n 's/.*"code":"\([^"]*\)".*/\1/p')
echo "$SAVE_CODE" > /tmp/paycode.txt   # needed in TEST 3c
```
- Expected **200**. Second call with an unknown id:

### 2c. Invalid vendor number
```bash
curl -s -w '\n%{http_code}\n' "$BASE_URL/api/public/pay-status?vendor_number=V-99999"
```
- Expected **404** `{"error":"Vendor not found"}`.

### 2d. Missing vendor id
```bash
curl -s -w '\n%{http_code}\n' "$BASE_URL/api/public/pay-status"     # → 400
```

### 2e. Staff-side vendor identity view + payment history
```bash
curl -s -b A.jar "$BASE_URL/api/payments/verify?vendor_number=V-01001"
# → vendor{…, paid_today, today_payment, history[10]}
```

**TEST 2 verdict: NOT IMPLEMENTED (vendor authentication/self-service).** To add it:
either issue each vendor a phone-based PIN/OTP login (a `Vendor` table already has
`phone_number` + `wallet_number` fields to anchor it), or at minimum provide a tokenised
"my stall" link like the QR pay-code page.

---

## 7. TEST 3 — Mobile wallet payments (SIMULATED — say so)

**Reality check before the commands:** There is no Airtel/TNM SDK or API client in the
codebase. Every wallet flow below either (a) creates a Pending record and expects a
webhook you trigger yourself, or (b) marks a Completed record directly. **None of these
reach a real operator.** Do not show anyone this as a deployed wallet product until a
real integration is built (e.g. Airtel Africa / TNM OpenAPI with merchant keys, with
real charge callbacks calling the existing webhook endpoints).

### 3a. Staff-initiated wallet payment → Pending
```bash
curl -s -w '\n%{http_code}\n' -b A.jar -H 'Content-Type: application/json' -X POST \
  "$BASE_URL/api/payments" \
  -d '{"vendor_number":"V-01001","amount":300,"payment_channel":"AirtelMoney"}'
# 200: { success, payment:{ status:"Pending", transaction_ref:"AM-XXXX-NNNN", … }, message:"Wallet payment initiated…" }
WREF=$(body | sed -n 's/.*"transaction_ref":"\([^"]*\)".*/\1/p'); echo "$WREF" > /tmp/wref.txt
```
- Wrong amount (fee mismatch) → **400** `Amount must be the applicable fee (MWK 300)`.
- Collector trying channel AirtelMoney → **403** cash-only.

### 3b. "Provider" confirms the payment (webhook simulation)
```bash
curl -s -w '\n%{http_code}\n' -X POST "$BASE_URL/api/webhook/airtel" \
  -H 'Content-Type: application/json' \
  -d "{\"transaction_ref\":\"$WCONF\",\"vendor_number\":\"V-01001\",\"amount\":300,\"status\":\"SUCCESS\",\"payer_phone\":\"0999777001\",\"provider_ref\":\"SIMULATED-1\"}"
# 200 { received:true, payment_id, payment_status:"Completed" }
```
- **Failed stays unconfirmed:** same call with `"status":"FAILED"` → payment_status `"Failed"` and the map does NOT turn green.
- **Duplicate webhook:** send the SAME `transaction_ref` again → `200 { duplicate:true }`, no second row.

### 3c. Vendor-side QR pay-code payment (the "self-pay" simulation)
```bash
CODE=$(cat /tmp/paycode.txt)
curl -s -w '\n%{http_code}\n' -X POST "$BASE_URL/api/pay/paycode" \
  -H 'Content-Type: application/json' \
  -d "{\"vendor_number\":\"V-01001\",\"code\":\"$CODE\",\"amount\":300,\"payment_channel\":\"TNMMpamba\",\"payer_phone\":\"0881122233\"}"
# 201 { paid:true, payment_id, amount, receipt_ref }        (or 200 already_paid)
# Forged code test:
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE_URL/api/pay/paycode" \
  -H 'Content-Type: application/json' \
  -d '{"vendor_number":"V-01001","code":"0000000000000000000000000000000","amount":300,"payment_channel":"AirtelMoney"}'
# → 403 Invalid pay code
```
Note: unlike the staff→webhook path, pay-code marks **Completed immediately** — that is a design shortcut for the QR page, again simulated.

### 3d. Receipt / notification retrieval (the gap)
```bash
curl -s -b A.jar "$BASE_URL/api/reminders" | sed -n 's/.*"status":"\(Sent\|Logged\)".*/&/p'   # crude; or:
psql "$DATABASE_URL" -c "SELECT channel, status, sent_at, content FROM \"Notification\" ORDER BY notification_id DESC LIMIT 3;"
```
- There is **no `GET .../receipt` endpoint** and `receipt_generated` is never set. The receipt exists as an SMS-content row in `Notification` only. **Verdict: PARTIAL — generation yes, retrievable-by-endpoint no.**

**TEST 3 verdict: Integration = SIMULATED (webhook-style). Core state machine (Pending →
Completed/Failed, refs, dedupe-on-ref, idempotency) = workable in code; gaps: no
operator call-outs, no webhook signature checks, no same-day wallet idempotency on the
webhook path, and no receipt endpoint.**

---

## 8. TEST 4 — Cash payment by a collector (fully implemented)

```bash
# 1) find a vendor that is unpaid today
curl -s -b C.jar "$BASE_URL/api/vendors?search=V-01999"    # or search a section name
UNPAID_VENDOR="V-01001"   # <-- set from search results above

# 2) record the cash payment
curl -s -w '\n%{http_code}\n' -b C.jar -H 'Content-Type: application/json' -X POST \
  "$BASE_URL/api/payments" \
  -d "{\"vendor_number\":\"$UNPAID_VENDOR\",\"amount\":300,\"payment_channel\":\"Cash\"}"
# 200 { success, payment:{ status:"Completed", collector_id:<own id>, payment_channel:"Cash", paid_at:"…", transaction_ref:"MS-…" }, message:"…dot is now GREEN…" }
CASH_REF=$(…); CASH_PAY_ID=$(…)

# 3) verify attribution + timestamp in DB
psql "$DATABASE_URL" -c "SELECT payment_id, collector_id, amount, status, paid_at, created_at FROM \"Payment\" WHERE transaction_ref='$CASH_REF';"

# 4) duplicate same-day → 409
curl -s -w '\n%{http_code}\n' -b C.jar -H 'Content-Type: application/json' -X POST \
  "$BASE_URL/api/payments" \
  -d "{\"vendor_number\":\"$UNPAID_VENDOR\",\"amount\":300,\"payment_channel\":\"Cash\"}"
# → 409 { error:"Vendor has already paid today", payment:{…} }

# 5) whatever the collector tries to blame on someone else: the body accepts no
#    collector id at all — the API sets it from the session. Verify with a
#    collector whose ID differs from the seeded one and read collector_id.
```

**TEST 4 verdict: PASS by code inspection; run above to confirm at runtime.** Collector ID ✔, timestamp ✔ (`paid_at`/`created_at`), receipt (SMS/Logged row) ✔, transaction history ✔ (`/api/payments`, `/api/payments/verify`, vendor profile), payment status update ✔ (map flips green).

---

## 9. TEST 5 — Live Map correctness

```bash
curl -s -b C.jar "$BASE_URL/api/map" > /tmp/map.json
python3 -c "import json;d=json.load(open('/tmp/map.json'));
 v=[x for x in d['vendors'] if x['vendor_number']=='$UNPAID_VENDOR']; print(v)"
# → paid_today: True, dot: "green" right after TEST 4
python3 -c "import json;d=json.load(open('/tmp/map.json'));print(d['stats'])"   # {total, paid, unpaid, compliance}
# Boundary check:
curl -s -b C.jar "$BASE_URL/api/map?filter=unpaid" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["boundary"], len(d["vendors"]))'
```
- Expected after cash payment: `paid_today:true, dot:"green"`; before it, `"red"`.
- Colours are computed **from the DB** (Controller: `payments.where(status:"Completed", paid_at ≥ today)`). There is no manually assigned colour anywhere — passing this test requires the DB row from TEST 4.
- **Pending wallet payment keeps the dot RED** — unless confirmed via TEST 3b, because green needs `status:"Completed"`. Try it: create a fresh Pending wallet payment in the morning via TEST 3a on a new vendor and observe the map.
- **Collection-period**: not supported on this endpoint (today only) → that spec line = NOT IMPLEMENTED on the map; the *daily report* is date-aware instead.

---

## 10. TEST 6 — Dashboard & revenue monitoring

```bash
before=$(curl -s -b A.jar "$BASE_URL/api/dashboard")
# make ONE confirmed cash payment (a vendor not yet paid today):
… (register a fresh vendor via TEST 1b, then cash record via TEST 4)
after=$(curl -s -b A.jar "$BASE_URL/api/dashboard")
python3 - <<'PY'
 # paste before/after JSON files here and diff the numbers
PY
# Expected diffs: total_vendors +1, paid_today +1, revenue_today +300, transactions_today +1, compliance up
```
- Confirmed-only money: revenue metrics sum `status:"Completed"` payments only. Pending and Failed amounts are never revenue — inject a Failed webhook payment (TEST 3b step with FAILED) and re-check `revenue_today` doesn't move.
- **Cash vs wallet split:** NOT on the dashboard; use the daily report which does have it:
```bash
curl -s -b A.jar "$BASE_URL/api/reports/daily"    # channels: [{name:"Cash",amount},
                                                  #  {name:"AirtelMoney",amount}, …]
curl -s -b A.jar "$BASE_URL/api/reports/daily?date=2026-10-12"
```
- **Supervisor scoping**: dashboard uses the supervisor's own sub-office markets only; a supervisor of a different sub-office gets roughly different numbers.

---

## 11. TEST 7 — RBAC matrix (run in order; every "denied by design")

| Test | Command pattern | Expected |
|------|----------------|----------|
| Collector cannot manage API credentials | `curl -s -w '\n%{http_code}\n' -b C.jar -X POST "$BASE_URL/api/api-clients" -H 'Content-Type: application/json' -d '{"name":"Airtel","contact_email":"a@b.c"}'` | **403** |
|Collector cannot create/modify fee rates | No such endpoint exists at all; closest fee data is **GET /api/vendors/meta** (allowed). Verdict: nothing to hit; rate management is yet to be built | NOT IMPLEMENTED (also see section 2 row) |
| Collector cannot read audit logs | `curl -s -w '\n%{http_code}\n' -b C.jar "$BASE_URL/api/audit-logs"` | **403** |
| Supervisor cannot read audit logs / manage collectors / API clients | same calls with `-b S.jar` | **403** ×3 |
| Supervisor may list markets, may NOT create | `-b S.jar -X POST /api/markets -d '{…}'` | GET 200 / POST **403** |
| Unauthenticated hits protected data | `curl -s -w '\n%{http_code}\n' "$BASE_URL/api/vendors"` and the same for /api/dashboard, /api/map, /api/payments | **401** every time |
| Collector cannot register vendors / wallet-record | 403 both (TEST 1d / TEST 3) ✔ |
| Vendor privacy | With no vendor accounts there is nothing to "leak" — every vendor's data IS readable by any logged-in staff in their scope, and the **public** pay-status endpoint intentionally exposes name/owner/market/fee/paid flag. No cross-vendors private info at all. Verdict: N/A until vendor login exists |
| Supervisors see everything in their own sub-office | assert a supervisor sees each of their own sub-office vendors but not others' markets via `/api/vendors?market_id=` crosscheck | 200 scoped |

Invalid/expired authentication (TEST 9 subset) also belongs here:
```bash
# expired/invalid token → auth/me returns 401
curl -s -w '\n%{http_code}\n' --cookie 'token=not.a.jwt' "$BASE_URL/api/auth/me"
# tampered signature → also 401 (HS256 verification fails)
```
Cookies expire in 8h (`maxAge: 60*60*8`) — to test expiry, wait for the cookie to lapse after 8 hours; there is no API to force-expire a token early (no revocation list — note this as a hardening item).

---

## 12. TEST 8 — Reports and audit logs

```bash
curl -s -b A.jar "$BASE_URL/api/reports/daily" | python3 -m json.tool
curl -s -b A.jar "$BASE_URL/api/reports/daily?date=$(date -d yesterday +%F)"   # date filter works
# audit trail: after all of the above actions
curl -s -b A.jar "$BASE_URL/api/audit-logs?action=PAYMENT&limit=5" | python3 -m json.tool
# expect rows: actor_type "User"/"ApiClient", action PAYMENT, details "Recorded Cash payment of MWK 300 for V-01001…"
curl -s -b A.jar "$BASE_URL/api/audit-logs?action=CREATE"      # vendor registrations too
```
- Audit of registrations ✔, login ✔ (`LOGIN` rows), payments incl. wallet webhooks ✔.
- Admin-only read ✔ (others 403, shown in TEST 7).
- Tested-but-not-audited: logOUT, API-key creation/deactivation, supervisor DELETE (actually supervisors DELETE IS audited via Supervisor soft-delete; logOUT isn't wrapped).

---

## 13. TEST 9 — Error and security hardening sweep (each one is a negative test)

| Attempt | Command | Expected |
|---|---|---|
| Missing required login field | `-d '{"username":"admin"}' /api/auth/login` | 400 |
| Bad credentials | wrong password | 401 `Invalid username or password` |
| Missing payment fields | payment POST without amount | 400 `vendor_number and amount are required` |
| Nonexistent vendor in payment | `{"vendor_number":"V-99999",…}` | 404 `Vendor not found` |
| Invalid market id at registration | `market_id: 9999` | 404 `Market not found` |
| Amount ≠ fee | payment `{"amount":250,…}` | 400 `Amount must be the applicable fee…` |
| Duplicate transaction_ref via webhook | resend exact webhook body | 200 `duplicate:true` and DB has ONE row |
| Coordinates outside boundary | register with `gps 100.5, 200.4` | **SNAPPED** inside fence and registered with `geofence.inside:false` informational; NOT rejected → design gap, see section 2 |
| Invalid phone number | `"phone_number":"abc"` at registration | **ACCEPTED** → gap: only presence is checked, format validation is missing |
| Invalid pay-code | TEST 3c forged code | 403 |
| Missing/invalid API key on external APIs | `curl -s -o /dev/null -w '%{http_code}\n' "$BASE_URL/api/external/vendors"` and `--header 'x-api-key: wrong'` | 401 / 401 |
| Rate limiting | hammer /api/external/* beyond the client's `rate_limit` | 429 once seeded key runs out |
| Unsigned webhook | `curl -X POST /api/webhook/airtel -d '{…}' -H 'Content-Type: application/json'` | ⚠ **200** with valid body — webhook authenticity NOT implemented; this is the biggest security finding.|
| Invalid webhook body | `{"foo":1}` | 400 `transaction_ref, amount and status are required` |
| Webhook for unknown vendor | include `vendor_number:"V-99999"` | 404 `Vendor not found for this payment` |

---

## 14. STEP 5 — END-TO-END SCENARIO 1: vendor to confirmed wallet payment (adjusted to the real code)

Because self-registration and vendor login don't exist, Scenario 1 **uses an
Administrator for step 1 and simulates the operator webhook in step 6**. Every step here maps to
a command you've already seen above; run them strictly in this sequence, with fresh
variables. Nothing here touches real wallets.

```bash
# ===== SCENARIO 1 =====
# 1) Register the vendor (admin/Supervisor, staff-assisted) → 1b command
#    (or use the supervisor jar S.jar — supervisors can register)
#    → VENDOR1, GPS source "gps" or "derived", geofence {inside:true}

# 2) Vendor ID captured automatically (VENDOR1 variable)
VENDOR1=$(sed -n 's/.*"vendor_number":"\([^"]*\)".*/\1/p' /tmp/v1.json)

# 3) Confirm the vendor exists
curl -s -b A.jar "$BASE_URL/api/vendors?search=$VENDOR1" | grep -c "$VENDOR1"     # ≥1
#    DB: SELECT vendor_number, registration_date FROM "Business" WHERE vendor_number='$VENDOR1';

# 4) Confirm the vendor appears on the Live Map (green if nothing paid yet)
curl -s -b A.jar "$BASE_URL/api/map" | grep -o "\"vendor_number\":\"$VENDOR1\"[^}]*"   # dot:"red"

# 5) Initial payment status  (public + staff views)
curl -s "$BASE_URL/api/public/pay-status?vendor_number=$VENDOR1"    # paid_today:false + code

# 6) "Initiate" wallet payment (admin records the vendor-initiated Airtel intent)
curl -s -b A.jar -H 'Content-Type: application/json' -X POST "$BASE_URL/api/payments" \
  -d "{\"vendor_number\":\"$VENDOR1\",\"amount\":300,\"payment_channel\":\"AirtelMoney\"}"
WREF=$(…)   # transaction_ref of the PENDING payment record

# 7) Verify the payment status (before confirmation: Pending, dot red)
curl -s -b A.jar "$BASE_URL/api/payments/verify?vendor_number=$VENDOR1"

# 7b) Simulated operator confirmation  (webhook you trigger, same as TEST 3b)
curl -s -X POST "$BASE_URL/api/webhook/airtel" -H 'Content-Type: application/json' \
  -d "{\"transaction_ref\":\"$WREF\",\"vendor_number\":\"$VENDOR1\",\"amount\":300,\"status\":\"SUCCESS\",\"provider_ref\":\"SIM-1\"}"
#    NOTE: this updates the ORIGINAL Pending transaction only if you reuse its
#    transaction_ref — recommended for the test; resend it once to see dedupe.

# 8) Successful payment updates the vendor
curl -s -b A.jar "$BASE_URL/api/payments/verify?vendor_number=$VENDOR1"   # today_payment present

# 9) Live Map reflects the payment
curl -s -b A.jar "$BASE_URL/api/map" | grep -A2 "$VENDOR1" | grep -o '"dot":"green"'

# 10) Dashboard reflects confirmed revenue: revenue_today +300 (use TEST 6 diff)

# 11) Retrieve the proof of the transaction (NOT a stored receipt — this is the gap):
curl -s -b A.jar "$BASE_URL/api/payments?search=$WREF"       # the only machine-readable "receipt"
psql "$DATABASE_URL" -c "SELECT content,status,sent_at FROM \"Notification\" ORDER BY notification_id DESC LIMIT 2;"   # receipt SMS text row

# 12) Audit trails
curl -s -b A.jar "$BASE_URL/api/audit-logs?action=CREATE" | grep "$VENDOR1"   # vendor registration row
curl -s -b A.jar "$BASE_URL/api/audit-logs?action=PAYMENT"                    # includes ApiClient/Airtel row from webhook
```

---

## 15. STEP 6 — END-TO-END SCENARIO 2: cash collected by an authenticated Collector

```bash
# ===== SCENARIO 2 =====
# 0) Seed provides vendors V-01001… pick one that is unpaid today:
BASE_URL=... ; ./(cookie jars already built)
TARGET="V-01099"   # set from  curl -s -b C.jar "$BASE_URL/api/vendors?filter-unpaid page" (or search)

# 1) Authenticated vendor SEARCH (collector sees ALL vendors by design)
curl -s -b C.jar "$BASE_URL/api/vendors?search=$TARGET"

# 2) Verify the vendor is unpaid NOW
curl -s -b C.jar "$BASE_URL/api/map" | grep "$TARGET" | grep -o '"dot":"red"'

# 3) Record cash payment (fee-matched amount from the type: 300 for Market Vendor)
curl -s -b C.jar -H 'Content-Type: application/json' -X POST "$BASE_URL/api/payments" \
  -d "{\"vendor_number\":\"$TARGET\",\"amount\":300,\"payment_channel\":\"Cash\"}"
# → payment_id + transaction_ref (MS-…), collector_id set from session, status Completed

# 4) Duplicate attempt REJECTED
… same call again → 409 { error:"Vendor has already paid today" }

# 5) Collector's own transaction history: the payment belongs to THEM (scope shows it)
curl -s -b C.jar "$BASE_URL/api/payments?search=$TARGET"      # visible
# … while a DIFFERENT collector account should NOT see it in their own history:
# C2.jar for a second collector seeded account → same call should return 0 rows for the new payment id.

# 6) Map now green
curl -s -b C.jar "$BASE_URL/api/map" | grep "$TARGET" | grep -o '"dot":"green"'

# 7) Daily cash revenue reflects it
curl -s -b A.jar "$BASE_URL/api/reports/daily" | python3 -c "import sys,json;d=json.load(sys.stdin);print([c for c in d['channels'] if c['name']=='Cash'])"

# 8) Audit: action=PAYMENT row with actor = the collector's seeded full name
curl -s -b A.jar "$BASE_URL/api/audit-logs?action=PAYMENT" | grep "$TARGET"

# 9) DB truth check
psql "$DATABASE_URL" -c "SELECT p.transaction_ref,p.amount,p.status,p.paid_at,c.full_name
 FROM \"Payment\" p LEFT JOIN \"Collector\" c ON c.collector_id=p.collector_id
 WHERE p.business_id=(SELECT business_id FROM \"Business\" WHERE vendor_number='$TARGET')"
```

---

## 16. STEP 7 — Final test report (code-inspection + runtime-where-runnable)

| # | Test | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Public vendor self-registration | **NOT IMPLEMENTED** | No unauthenticated registration route; POST /api/vendors is session-gated and collector-blocked (`app/api/vendors/route.ts`) |
| 1 | Unique Vendor ID, field validation, DB persistence, map presence | **PASS** (staff path) | V-NNNNN `@unique` generation, 400 on missing fields, geofence util, map/list include new vendors |
| 1 | Duplicate-proof registration (same person) | **FAIL** | No phone/NID dedupe |
| 1 | Coordinate boundary enforcement | **FAIL** | Outside points are repositioned inside, never rejected |
| 2 | Vendor authentication / self-service portal | **NOT IMPLEMENTED** | Only three staff tables are authenticated; no vendor secret store |
| 2 | Vendor lookup by Vendor ID + status checks | **PASS (public pay-status) / PASS (staff verify)** | `/api/public/pay-status`, `/api/payments/verify` |
| 3 | Real Airtel Money/TNM Mpamba integration | **NOT IMPLEMENTED** | No operator client code; doc-level only |
| 3 | Simulated wallet initiation→ref→Pending→confirm→Completed/Failed | **PASS (as a simulation)** | POST /api/payments + webhook/external processors |
| 3 | Webhook authenticity | **FAIL** | /api/webhook/* unsigned and reachable publicly |
| 3 | Same-day wallet idempotency on webhook path | **FAIL** | processWalletWebhook checks only ref-duplication, not already-paid-today |
| 3 | Receipt endpoint | **NOT IMPLEMENTED** (generation is PARTIAL) | Notification rows only; no GET route; `receipt_generated` unused |
| 4 | Collector cash flow end-to-end | **PASS** | attribution by session, 409 idempotent, receipt, audit |
| 5 | Map red/green from DB | **PASS** | derived from Completed-today payments server-side |
| 5 | Collection-period selector for map | **NOT IMPLEMENTED** | today-only logic |
| 6 | Dashboard totals, paid/unpaid, confirmed-only revenue | **PASS** | aggregates filter status Completed only |
| 6 | Dashboard cash-vs-wallet split | **FAIL** | exists only in /api/reports/daily |
| 7 | RBAC per matrix (this + TEST 7 table) | **PASS** | 401/403 implemented consistently; wallet-write correctly staff/admin; map list scoped |
| 8 | Reports (+date filter) & audit logs & admin-only audit | **PASS** | /api/reports/daily date-aware; audit-logs rate admin-only |
| 9 | Field/amount/not-found validation, dupes, bad tokens, invalid API keys | **PASS** (see sweep table) | consistent 400/401/403/404/409 |
| 9 | Phone validation | **FAIL** | format not checked |
| 9 | Boundary rejection | **FAIL** | snap-in instead |
| 9 | Webhook signature | **FAIL** | signed external API exists (x-api-key) but public webhook paths lack it |
| — | Fee-rate management | **NOT IMPLEMENTED** | no CRUD endpoint for BusinessType.fee_amount |
| — | Log-out event audit | **PARTIAL** | LOGOUT exists as enum but POST /api/auth/logout doesn't log |

---

## 17. What to build to close the loop (spec→code priority)

1. **Public vendor self-registration** `POST /api/vendors/register` — captcha/rate-limited,
 phone format + phone/NID dedupe, **reject** out-of-boundary coords (or collect-and-review),
 auto-issue vendor_number, queue a "Registration" SMS like payments already do.
2. **Vendor identity**: OTP-to-phone login (vendors already carry `phone_number`/`wallet_number`)
 introducing a `Vendor` session type on top of the existing token payload, so RBAC can scope
 vendors to their own business only.
3. **Real wallet integration**: Airtel Africa Money API / TNM OpenAPI with merchant keys
 (sandbox first), call `/api/external/payments`-style POST, keep webhooks but require
 **signature verification** on them.
4. **Receipt**: `GET /api/payments/{id}/receipt` (or vendor-facing), set `receipt_generated`.
5. **Fee management**: minimal `PATCH /api/business-types/{id}` (Administrator only) + audit.
6. **Period-aware map**: `?date=` on `/api/map` reusing the reports logic.

— End of test suite document —
