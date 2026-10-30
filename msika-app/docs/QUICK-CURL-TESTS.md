# Quick cURL Tests — “Is the system working?”

Copy-and-paste commands to verify the live system in under 5 minutes:
register a vendor with exact GPS coordinates → it appears on the map as a dot →
record a payment → the dot flips green → revenue and reports reflect it.

For the complete 9-test suite with expected status codes and DB checks, see
[`api-test-suite.md`](api-test-suite.md).
Requires the dev server running (`npm run dev` in `msika-app/`) and the seeded
test accounts (printed by `npx prisma db seed`).

```bash
BASE=http://localhost:3000

# --- 0. Log in as Administrator (cookie jar) and as Collector -----------------
curl -s -c admin.jar -H 'Content-Type: application/json' \
  -d '{"username":"<admin test username>","password":"<seeded test password>"}' \
  "$BASE/api/auth/login"
# → {"success":true,"role":"Administrator",…}

curl -s -c coll.jar -H 'Content-Type: application/json' \
  -d '{"username":"<collector test username>","password":"<seeded test password>"}' \
  "$BASE/api/auth/login"

# --- 1. Register a vendor at EXACT recorded coordinates -----------------------
curl -s -b admin.jar -H 'Content-Type: application/json' -X POST \
  "$BASE/api/vendors" -d '{
    "business_name":"Curl Test Stall","owner_name":"Test Owner",
    "phone_number":"0999000001","market_id":1,"business_type_id":1,
    "section_id":5,"gps_latitude":-15.8195,"gps_longitude":35.0532
  }'
# ✔ Exact coordinates are kept (geo-reference, not snapped):
#   {"success":true,"vendor_number":"V-…","location":{"lat":-15.8195,"lng":35.0532,"source":"gps"},
#    "geofence":{"inside":true,…}}
#  Save the new vendor number:
VENDOR=$(curl -s -b admin.jar "$BASE/api/vendors?search=Curl%20Test%20Stall" \
  | sed -n 's/.*"vendor_number":"\(V-[0-9]*\)".*/\1/p' | head -1)
echo "new vendor = $VENDOR"

# --- 2. The registered vendor appears on the Live Map with its coordinates ----
curl -s -b admin.jar "$BASE/api/map" | grep "\"vendor_number\":\"$VENDOR\""
# ✔ A red (unpaid) dot exists at the exact recorded coordinates, e.g.
#   {"vendor_number":"V-…","business_name":"Curl Test Stall",…,
#    "lat":-15.8195,"lng":35.0532,"paid_today":false,"dot":"red"}

# --- 3. Collector records a CASH payment for that vendor ----------------------
curl -s -b coll.jar -H 'Content-Type: application/json' -X POST \
  "$BASE/api/payments" \
  -d "{\"vendor_number\":\"$VENDOR\",\"amount\":300,\"payment_channel\":\"Cash\"}"
# ✔ {"success":true,"payment":{"status":"Completed","collector_id":…,
#    "paid_at":"…","transaction_ref":"MS-…"}, "message":"Cash payment recorded — dot is now GREEN…"}

# --- 4. Duplicate same-day payment is rejected --------------------------------
curl -s -o /dev/null -w '%{http_code}\n' -b coll.jar -H 'Content-Type: application/json' -X POST \
  "$BASE/api/payments" \
  -d "{\"vendor_number\":\"$VENDOR\",\"amount\":300,\"payment_channel\":\"Cash\"}"
# → 409 {"error":"Vendor has already paid today"}

# --- 5. The map now shows the vendor GREEN at the same coordinates ------------
curl -s -b admin.jar "$BASE/api/map" | grep "$VENDOR" | grep '"dot":"green"'
# ✔ {"paid_today":true,"dot":"green"} — status derives from the payment DB

# --- 6. Dashboard revenue reflects the payment --------------------------------
curl -s -b admin.jar "$BASE/api/dashboard" \
  | sed -n 's/.*"revenue_today":\([0-9]*\).*/revenue_today=\1/p'   # +300
curl -s -b admin.jar "$BASE/api/dashboard" \
  | sed -n 's/.*"new_vendors_week":\([0-9]*\).*/new_week=\1/p'     # +1 vendor

# --- 7. Verify a vendor on the field (payment status + history) ---------------
curl -s -b coll.jar "$BASE/api/payments/verify?vendor_number=$VENDOR"
# ✔ vendor.paid_today = true, today_payment populated, history present

# --- 8. Mobile-money flow (Airtel) — initiate, then confirm via webhook -------
curl -s -b admin.jar -H 'Content-Type: application/json' -X POST \
  "$BASE/api/payments" \
  -d "{\"vendor_number\":\"V-01001\",\"amount\":300,\"payment_channel\":\"AirtelMoney\"}"
# → status "Pending" with a transaction_ref AM-… ; the dot stays RED until confirmation
#   (pick a vendor that has NOT paid today, or use one tomorrow)
curl -s -X POST "$BASE/api/webhook/airtel" -H 'Content-Type: application/json' \
  -d '{"transaction_ref":"AM-TESTREF1","vendor_number":"V-01001","amount":300,"status":"SUCCESS"}'
# → {"received":true,…,"payment_status":"Completed"} — dot flips GREEN

# --- 9. Reports & audit record everything -------------------------------------
curl -s -b admin.jar "$BASE/api/reports/daily" | head -c 400
curl -s -b admin.jar "$BASE/api/audit-logs?action=PAYMENT&limit=3" | head -c 400
# ✔ Daily report totals include the cash + wallet payments; audit logs show
#   the registration (action=CREATE) and both payment rows.
```

Use fresh vendor numbers / refs when re-running — payments are one-per-vendor-per-day.
