# Msika — Digital Market Fee Management & Revenue Monitoring System

**Blantyre City Council · Limbe Market (case study)**
A digital platform for accurate daily market fee collection, live stall mapping,
real-time revenue monitoring, SMS receipts/reminders and vendor payment verification —
replacing paper-based ticket collection that leaked revenue.

> 💡 **Deep dive:** the full engineering README lives in [`msika-app/README.md`](msika-app/README.md)
> (architecture diagrams, algorithms, DB schema, API reference). Test commands per endpoint:
> [`msika-app/docs/api-test-suite.md`](msika-app/docs/api-test-suite.md).

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![PostgreSQL + Prisma 7](https://img.shields.io/badge/PostgreSQL-Prisma%207-336791)](https://www.prisma.io)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06b6d4)](https://tailwindcss.com)
[![Smoke 56/56](https://img.shields.io/badge/smoke%20tests-56%2F56%20PASS-brightgreen)](#4-validation)

---

## 1. What the system does

Msika digitizes daily market fee collection for city councils. Field collectors
see a live, geo-fenced map of every stall at Limbe Market — green dot = paid
today, red dot = unpaid — and record cash payments in one tap. Vendors can pay
by scanning their stall's QR code through Airtel Money or TNM Mpamba
(webhook-driven). Every payment lands in PostgreSQL with a transaction
reference, updates the vendor's status instantly, rolls up into daily revenue
summaries, queues an SMS receipt, and writes an audit-log entry.

| Module | What it does |
|---|---|
| **Dashboard** | Live KPIs: total/active vendors, paid vs unpaid today, cash collected, compliance %, revenue trend |
| **Vendors** | Register vendors, search by name/phone/stall, vendor profile + payment history |
| **Live Map** | Geo-fenced Leaflet map of Limbe Market (real OpenStreetMap boundary); green = paid today, red = unpaid |
| **Payments** | Record cash (collector) or initiate mobile-money payments; verify by vendor number |
| **Reports / Pulse** | Daily/weekly revenue breakdowns by channel (Cash, AirtelMoney, TNMMpamba), section, fee type |
| **Markets** | Markets & sections with vendor counts and market-growth insight |
| **Collectors / Supervisors** | Add and manage field staff; collector cash stats |
| **Reminders** | SMS payment reminders to today's unpaid vendors (Twilio), 6h per-vendor cooldown |
| **API Management** | Register mobile-money providers, mint API keys, enable/disable clients |
| **Audit Logs** | Every registration, payment, login and key action recorded — admin view |
| **Settings** | Dark/light theme, profile, sign-out |

All modules require sign-in and are scoped by role:
**Administrator** (everything) / **Supervisor** (own sub-office) /
**Collector** (vendors + own-recorded payments) — enforced server-side.

## 2. Repository layout

```
├── msika-app/               ← the Next.js application (all source)
│   ├── app/                 routes: (auth), dashboard/*, pay/*, api/*
│   ├── components/          dashboard UI (Sidebar, Header, StatsCards, …)
│   ├── services/            business logic (Auth, Vendor, Payment, …)
│   ├── lib/                 geofence, paycode, wallet-webhook, market-intel,
│   │                        permissions, audit, sms, rate-limit, …
│   ├── hook/                data hooks (useDashboard, useVendor, usePayment)
│   ├── prisma/              schema.prisma (17 models) + seed.ts
│   ├── scripts/smoke.sh     56-check end-to-end API suite (all passing)
│   └── docs/api-test-suite.md   per-endpoint cURL test walkthrough
└── README.md                ← this file
```

## 3. Quick start

```bash
cd msika-app

# 1. Configure env (Postgres must be reachable)
cp .env.example .env
#    DATABASE_URL   = postgresql://…
#    JWT_SECRET     = openssl rand -base64 32

# 2. Install + create schema + seed demo data (council, market, sections,
#    business types with fees, staff, vendors, sample payments)
npm install
npx prisma migrate dev
npx prisma db seed        # prints the seeded test credentials

# 3. Run
npm run dev               # http://localhost:3000

# 4. Prove everything works
BASE=http://localhost:3000 sh scripts/smoke.sh
# → SUMMARY: PASS 56 / WARN 0 / FAIL 0 — ALL FEATURES OPERATIONAL
```

Seeded test vendors start at `V-01001`. Default accounts (`admin`, `j.phiri`,
`a.banda`, `m.banda`) are **test-data only** — passwords are printed by the
seed script and must be rotated before any real deployment.

## 4. Validation

- `msika-app/scripts/smoke.sh` — end-to-end suite covering auth, RBAC
  negatives (403), vendor registration, cash payments + duplicate rejection
  (409), mobile-money initiation + webhook fulfilment for Airtel **and** TNM,
  external API-key access with rate limiting, map payloads, market
  intelligence, reminders with cooldown, daily reports, and audit logs.
- `msika-app/docs/api-test-suite.md` — beginner-friendly cURL commands per
  endpoint with expected status codes and database verification queries.
- Type safety: TypeScript strict mode; `next build` gates every deploy.

## 5. Deployment (Vercel)

1. Import the repository in Vercel, **Root Directory**: `msika-app`.
2. Keep the default build (`npm run build`); Prisma generate + `migrate deploy`
   run via the `vercel-build` hook.
3. Set env vars per environment: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`
   (all required before the first deploy), plus `TWILIO_ACCOUNT_SID`,
   `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` for real SMS.
4. Provision PostgreSQL (Neon/Supabase/RDS) and run
   `npx prisma migrate deploy` once against it.
5. Vercel Cron calls `/api/cron/reminders` daily at 08:00 UTC with the
   `CRON_SECRET` Bearer token.

Runbook: rotations and seeds are dev-only (`prisma migrate reset` +
`npm run db:seed`); production uses `migrate deploy` only — never reset a live DB.

Secrets stay in env files (`.env.example` lists them) — no `.env` is committed.
