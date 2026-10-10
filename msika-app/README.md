# Msika App

Next.js application for Blantyre City Council market operations.

## Deploy to Vercel

1. Import this repository in Vercel and set **Root Directory** to `msika-app`.
2. Use the Next.js framework preset and keep the default build command (`npm run build`).
3. Provision a PostgreSQL database reachable by Vercel. Add these environment variables to the Vercel project for every deployment environment before the first build (Prisma Client generation runs during install):
   - `DATABASE_URL` — the PostgreSQL connection string, including SSL settings required by your provider.
   - `JWT_SECRET` — a long, random secret used to sign sessions and vendor pay codes. Keep it stable across deployments.
   - `CRON_SECRET` — a separate long, random secret used to protect the scheduled reminder endpoint.
4. Apply the database migrations once, before serving traffic, from this directory with `DATABASE_URL` configured:

   ```bash
   npx prisma migrate deploy
   ```

5. Deploy. Vercel Cron invokes `/api/cron/reminders` daily at 08:00 UTC (10:00 in Blantyre); Vercel sends the `CRON_SECRET` as a Bearer token. The Hobby plan supports daily cron schedules. This is less frequent than the 30-minute schedule used by a persistent server.
6. To send SMS reminders and receipts, also configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`. Without them, notifications are recorded without sending SMS.

Do not commit `.env.local` or production credentials. `.env.example` lists the required and optional variables for local setup.

## Local development

Copy `.env.example` to `.env.local`, set `DATABASE_URL` and `JWT_SECRET`, then install dependencies and start the app:

```bash
cp .env.example .env.local
npm install
npm run dev
```

For local reminder testing, `CRON_SECRET` may be omitted; in production it is required.
