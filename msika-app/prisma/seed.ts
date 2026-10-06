// Idempotent database seed: Blantyre City Council market fee system.
// Run with: bun run db:seed
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import {
  apiClients,
  apiKeys,
  businessTypes,
  businesses,
  collectors,
  councils,
  marketSections,
  markets,
  payments,
  revenueSummaries,
  roles,
  subOffices,
  supervisors,
  users,
} from "../src/db/schema";
import { resolveVendorLocation } from "../lib/geofence";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const db = drizzle(pool);

const FIRST_NAMES = [
  "Grace", "John", "Mercy", "Patrick", "Esther", "Charles", "Liness", "Alinafe",
  "Blessings", "Chikondi", "Dorothy", "Edward", "Fanny", "Gimbi", "Hastings",
  "Irene", "James", "Khumbo", "Lucius", "Madalitso", "Nexon", "Olipa", "Pilirani",
  "Quinn", "Rhoda", "Saul", "Thandiwe", "Yamikani", "Zione", "Memory", "Tiwonge",
  "Getrude", "Fletcher", "Elias", "Dyson", "Chrissy", "Bertha", "Anold", "Violet",
  "Ulemu", "Sylvester", "Rabecca", "Petross", "Onesimus", "Nkhazina", "Limbani",
  "Kondwani", "Jennifa",
];
const LAST_NAMES = [
  "Banda", "Phiri", "Chirwa", "Mvula", "Nkhoma", "Moyo", "Kachale", "Ngwira",
  "Kaunda", "Gondwe", "Mkandawire", "Zimba", "Chilenje", "Kalua", "Mwale",
  "Sibale", "Chitheka", "Liwimbi", "Nyangulu", "Chimwaza",
];

// Deterministic pseudo-random generator so the seed is stable.
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Insert-if-absent by primary key, returning the row either way. */
async function insertOrGetRow<T extends Record<string, unknown>>(
  run: () => Promise<T[]>,
  fallback: () => Promise<T | undefined>
): Promise<T> {
  const inserted = await run();
  if (inserted.length > 0) return inserted[0];
  const found = await fallback();
  if (!found) throw new Error("insertOrGetRow: row disappeared");
  return found;
}

async function main() {
  console.log("Seeding Blantyre City Council market fee system...");

  // ---------- Council / office / market ----------
  const council = await insertOrGetRow(
    () =>
      db
        .insert(councils)
        .values({
          council_id: 1,
          name: "Blantyre City Council",
          district: "Blantyre",
          city: "Blantyre",
          contact_email: "info@blantyrecity.gov.mw",
          contact_phone: "+265 1 822 822",
        })
        .onConflictDoNothing()
        .returning(),
    () => db.select().from(councils).where(eq(councils.council_id, 1)).limit(1).then((r) => r[0])
  );

  const limbeOffice = await insertOrGetRow(
    () =>
      db
        .insert(subOffices)
        .values({
          sub_office_id: 1,
          council_id: council.council_id,
          name: "Limbe Sub Office",
          location: "Limbe Township",
        })
        .onConflictDoNothing()
        .returning(),
    () => db.select().from(subOffices).where(eq(subOffices.sub_office_id, 1)).limit(1).then((r) => r[0])
  );

  const limbe = await insertOrGetRow(
    () =>
      db
        .insert(markets)
        .values({
          market_id: 1,
          council_id: council.council_id,
          sub_office_id: limbeOffice.sub_office_id,
          name: "Limbe Market",
          location: "Limbe, Blantyre",
        })
        .onConflictDoNothing()
        .returning(),
    () => db.select().from(markets).where(eq(markets.market_id, 1)).limit(1).then((r) => r[0])
  );

  const sectionNames = ["Vegetables", "Fish", "Textiles", "Hardware", "Groceries", "Restaurants"];
  const sections: { section_id: number; section_name: string }[] = [];
  for (let i = 0; i < sectionNames.length; i++) {
    const s = await insertOrGetRow(
      () =>
        db
          .insert(marketSections)
          .values({ section_id: i + 1, market_id: limbe.market_id, section_name: sectionNames[i] })
          .onConflictDoNothing()
          .returning({ section_id: marketSections.section_id, section_name: marketSections.section_name }),
      () =>
        db
          .select({ section_id: marketSections.section_id, section_name: marketSections.section_name })
          .from(marketSections)
          .where(eq(marketSections.section_id, i + 1))
          .limit(1)
          .then((r) => r[0])
    );
    sections.push({ section_id: s.section_id, section_name: s.section_name });
  }

  // ---------- Business types ----------
  const typeDefs = [
    { name: "Market Vendor", fee_amount: 300, description: "Standard daily market stall fee" },
    { name: "Kupikulisa Bulk", fee_amount: 2000, description: "Bulk traders kupikulisa daily fee" },
    { name: "Restaurant", fee_amount: 500, description: "Food court / restaurant daily fee" },
    { name: "Butchery", fee_amount: 500, description: "Butchery daily fee" },
  ];
  const types: Record<string, number> = {};
  for (const t of typeDefs) {
    const [existing] = await db
      .select({ business_type_id: businessTypes.business_type_id })
      .from(businessTypes)
      .where(and(eq(businessTypes.name, t.name), eq(businessTypes.council_id, council.council_id)))
      .limit(1);
    if (existing) {
      types[t.name] = existing.business_type_id;
    } else {
      const [created] = await db
        .insert(businessTypes)
        .values({
          council_id: council.council_id,
          name: t.name,
          description: t.description,
          fee_amount: String(t.fee_amount),
        })
        .returning({ business_type_id: businessTypes.business_type_id });
      types[t.name] = created.business_type_id;
    }
  }

  // ---------- Roles & admin ----------
  const hash = await bcrypt.hash("password123", 10);

  await db
    .insert(roles)
    .values({ role_id: 1, role_name: "Administrator", description: "Full system access" })
    .onConflictDoNothing();
  await db
    .insert(roles)
    .values({ role_id: 2, role_name: "Collector", description: "Records cash payments and registers vendors" })
    .onConflictDoNothing();
  await db
    .insert(roles)
    .values({ role_id: 3, role_name: "Supervisor", description: "Oversees collectors in sub office" })
    .onConflictDoNothing();
  const [adminRole] = await db.select().from(roles).where(eq(roles.role_id, 1)).limit(1);

  await db
    .insert(users)
    .values({
      user_id: 1,
      username: "admin",
      password_hash: hash,
      full_name: "System Administrator",
      role_id: adminRole.role_id,
      council_id: council.council_id,
      email: "admin@blantyrecity.gov.mw",
    })
    .onConflictDoNothing();

  // ---------- Collectors ----------
  const collectorDefs = [
    { username: "j.phiri", full_name: "John Phiri", mobile: "0881234567" },
    { username: "a.banda", full_name: "Alice Banda", mobile: "0999876543" },
  ];
  for (let i = 0; i < collectorDefs.length; i++) {
    const c = collectorDefs[i];
    await db
      .insert(collectors)
      .values({
        collector_id: i + 1,
        council_id: council.council_id,
        sub_office_id: limbeOffice.sub_office_id,
        full_name: c.full_name,
        mobile_number: c.mobile,
        username: c.username,
        password_hash: hash,
      })
      .onConflictDoUpdate({
        target: collectors.collector_id,
        set: { full_name: c.full_name, mobile_number: c.mobile },
      });
  }

  // ---------- Supervisor ----------
  await db
    .insert(supervisors)
    .values({
      supervisor_id: 1,
      council_id: council.council_id,
      sub_office_id: limbeOffice.sub_office_id,
      full_name: "Mary Banda",
      username: "m.banda",
      password_hash: hash,
    })
    .onConflictDoNothing();

  // ---------- Businesses (vendors) ----------
  const rng = makeRng(20260928);
  const businessCount = 48;
  let created = 0;

  for (let i = 0; i < businessCount; i++) {
    const vendorNumber = `V-${String(1001 + i).padStart(5, "0")}`;
    const [existing] = await db
      .select({ business_id: businesses.business_id })
      .from(businesses)
      .where(eq(businesses.vendor_number, vendorNumber))
      .limit(1);
    if (existing) continue;

    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const section = sections[i % sections.length];
    const typeName = i % 9 === 0 ? "Kupikulisa Bulk" : i % 11 === 0 ? "Restaurant" : i % 13 === 0 ? "Butchery" : "Market Vendor";

    // Geo-fence algorithm: derive a stable stall position inside the fence.
    const resolved = resolveVendorLocation(vendorNumber, section.section_name, null);

    await db.insert(businesses).values({
      vendor_number: vendorNumber,
      council_id: council.council_id,
      market_id: limbe.market_id,
      section_id: section.section_id,
      business_type_id: types[typeName],
      registered_by_collector_id: (i % 2) + 1,
      business_name: `${first} ${last} Traders`,
      owner_name: `${first} ${last}`,
      phone_number: `0${8 + (i % 2)}${Math.floor(10000000 + rng() * 89999999)}`,
      national_id: `MW${Math.floor(10000000 + rng() * 89999999)}`,
      block: `B${(i % 6) + 1}`,
      stall_number: `S-${100 + i}`,
      gps_latitude: String(resolved.location.lat),
      gps_longitude: String(resolved.location.lng),
      preferred_wallet: i % 2 === 0 ? "AirtelMoney" : "TNMMpamba",
      wallet_number: `0${8 + (i % 2)}${Math.floor(10000000 + rng() * 89999999)}`,
      status: "Active",
      registration_date: new Date(Date.now() - Math.floor(rng() * 300) * 86400000),
    });
    created++;
  }
  console.log(`Businesses seeded: ${created} new (${businessCount - created} existing).`);

  // ---------- Payments: last 30 days + today ----------
  const businessRows = await db.select().from(businesses).orderBy(asc(businesses.vendor_number));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [existingPaymentsRow] = await db.select({ n: sql<number>`count(*)::int` }).from(payments);
  const existingPayments = existingPaymentsRow?.n ?? 0;
  let paymentsCreated = 0;

  if (existingPayments < 50) {
    // History: each business gets a few completed payments over past 30 days
    for (const b of businessRows) {
      const historyCount = 2 + Math.floor(rng() * 3);
      for (let d = 0; d < historyCount; d++) {
        const day = new Date(today.getTime() - (1 + Math.floor(rng() * 29)) * 86400000);
        day.setHours(7 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
        const [bt] = await db
          .select({ fee_amount: businessTypes.fee_amount })
          .from(businessTypes)
          .where(eq(businessTypes.business_type_id, b.business_type_id))
          .limit(1);
        const fee = Number(bt?.fee_amount ?? 300);
        const channel = b.preferred_wallet === "AirtelMoney" ? "AirtelMoney" : "TNMMpamba";
        await db.insert(payments).values({
          business_id: b.business_id,
          collector_id: null,
          amount: String(fee),
          fee_type: typeNameFor(fee),
          payment_channel: channel,
          transaction_ref: `${channel === "AirtelMoney" ? "AM" : "TM"}-${Date.now().toString(36).toUpperCase()}-${b.business_id}-${d}`,
          status: "Completed",
          paid_at: day,
          created_at: day,
          sms_sent: true,
        });
        paymentsCreated++;
      }
    }

    // Today: ~60% paid, rest unpaid (red dots on the map)
    for (let i = 0; i < businessRows.length; i++) {
      const b = businessRows[i];
      const paid = i % 10 < 6;
      if (!paid) continue;
      const [bt] = await db
        .select({ fee_amount: businessTypes.fee_amount })
        .from(businessTypes)
        .where(eq(businessTypes.business_type_id, b.business_type_id))
        .limit(1);
      const fee = Number(bt?.fee_amount ?? 300);
      const channel = b.preferred_wallet === "AirtelMoney" ? "AirtelMoney" : "TNMMpamba";
      const at = new Date(today.getTime() + (6 + (i % 8)) * 3600000);
      await db.insert(payments).values({
        business_id: b.business_id,
        collector_id: i % 3 === 0 ? (i % 2) + 1 : null,
        amount: String(fee),
        fee_type: typeNameFor(fee),
        payment_channel: i % 3 === 0 ? "Cash" : channel,
        transaction_ref: `${channel === "AirtelMoney" ? "AM" : "TM"}-TODAY-${b.business_id}`,
        status: "Completed",
        paid_at: at,
        created_at: at,
        sms_sent: true,
      });
      paymentsCreated++;
    }
    console.log(`Payments seeded: ${paymentsCreated}.`);
  } else {
    console.log(`Payments already present (${existingPayments}), skipping.`);
  }

  // ---------- Revenue summaries for the last 14 days ----------
  for (let d = 13; d >= 0; d--) {
    const day = new Date(today.getTime() - d * 86400000);
    const [agg] = await db
      .select({
        sum: sql<string>`coalesce(sum(${payments.amount}), 0)`,
        n: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.paid_at, day),
          lt(payments.paid_at, new Date(day.getTime() + 86400000)),
          eq(payments.status, "Completed")
        )
      );
    const totalAmount = Number(agg?.sum ?? 0);
    const totalTransactions = agg?.n ?? 0;
    await db
      .insert(revenueSummaries)
      .values({
        council_id: council.council_id,
        sub_office_id: limbeOffice.sub_office_id,
        market_id: limbe.market_id,
        summary_date: day.toISOString().slice(0, 10),
        total_amount: String(totalAmount),
        total_transactions: totalTransactions,
        successful_count: totalTransactions,
      })
      .onConflictDoUpdate({
        target: [revenueSummaries.market_id, revenueSummaries.summary_date],
        set: {
          total_amount: String(totalAmount),
          total_transactions: totalTransactions,
          successful_count: totalTransactions,
        },
      });
  }

  // ---------- API clients: Airtel & TNM ----------
  const clients = [
    { name: "Airtel Money Malawi", email: "api@airtelmw.example", perms: "payments:read,payments:write,webhook:send" },
    { name: "TNM Mpamba", email: "api@tnmmpamba.example", perms: "payments:read,payments:write,webhook:send" },
  ];
  for (const c of clients) {
    const [existing] = await db
      .select({ api_client_id: apiClients.api_client_id })
      .from(apiClients)
      .where(eq(apiClients.name, c.name))
      .limit(1);
    if (!existing) {
      const [createdClient] = await db
        .insert(apiClients)
        .values({
          council_id: council.council_id,
          name: c.name,
          contact_email: c.email,
        })
        .returning({ api_client_id: apiClients.api_client_id });
      await db.insert(apiKeys).values({
        api_client_id: createdClient.api_client_id,
        name: "production",
        key_hash: "seed-placeholder-hash-replace-via-api-management",
        permissions: c.perms,
        rate_limit: 1000,
      });
    }
  }

  console.log("Seed complete.");
  console.log("Logins -> admin/password123 (admin), j.phiri or a.banda /password123 (collectors)");
}

function typeNameFor(fee: number): string {
  if (fee >= 2000) return "Kupikulisa Bulk Fee";
  if (fee >= 500) return "Restaurant/Butchery Fee";
  return "Standard Daily Fee";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
