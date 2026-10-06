// Idempotent database seed: Blantyre City Council market fee system.
// Run with: bun run db:seed
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { resolveVendorLocation } from "../lib/geofence";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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

async function main() {
  console.log("Seeding Blantyre City Council market fee system...");

  // ---------- Council / office / market ----------
  const council = await prisma.council.upsert({
    where: { council_id: 1 },
    update: {},
    create: {
      name: "Blantyre City Council",
      district: "Blantyre",
      city: "Blantyre",
      contact_email: "info@blantyrecity.gov.mw",
      contact_phone: "+265 1 822 822",
    },
  });

  const limbeOffice = await prisma.subOffice.upsert({
    where: { sub_office_id: 1 },
    update: {},
    create: { council_id: council.council_id, name: "Limbe Sub Office", location: "Limbe Township" },
  });

  const limbe = await prisma.market.upsert({
    where: { market_id: 1 },
    update: {},
    create: {
      council_id: council.council_id,
      sub_office_id: limbeOffice.sub_office_id,
      name: "Limbe Market",
      location: "Limbe, Blantyre",
    },
  });

  const sectionNames = ["Vegetables", "Fish", "Textiles", "Hardware", "Groceries", "Restaurants"];
  const sections: { section_id: number; section_name: string }[] = [];
  for (let i = 0; i < sectionNames.length; i++) {
    const s = await prisma.marketSection.upsert({
      where: { section_id: i + 1 },
      update: {},
      create: { market_id: limbe.market_id, section_name: sectionNames[i] },
    });
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
    const existing = await prisma.businessType.findFirst({
      where: { name: t.name, council_id: council.council_id },
    });
    if (existing) {
      types[t.name] = existing.business_type_id;
    } else {
      const created = await prisma.businessType.create({
        data: {
          council_id: council.council_id,
          name: t.name,
          description: t.description,
          fee_amount: t.fee_amount,
        },
      });
      types[t.name] = created.business_type_id;
    }
  }

  // ---------- Roles & admin ----------
  const hash = await bcrypt.hash("password123", 10);

  const adminRole = await prisma.role.upsert({
    where: { role_id: 1 },
    update: {},
    create: { role_name: "Administrator", description: "Full system access" },
  });
  await prisma.role.upsert({
    where: { role_id: 2 },
    update: {},
    create: { role_name: "Collector", description: "Records cash payments and registers vendors" },
  });
  await prisma.role.upsert({
    where: { role_id: 3 },
    update: {},
    create: { role_name: "Supervisor", description: "Oversees collectors in sub office" },
  });

  await prisma.user.upsert({
    where: { user_id: 1 },
    update: {},
    create: {
      username: "admin",
      password_hash: hash,
      full_name: "System Administrator",
      role_id: adminRole.role_id,
      council_id: council.council_id,
      email: "admin@blantyrecity.gov.mw",
    },
  });

  // ---------- Collectors ----------
  const collectorDefs = [
    { username: "j.phiri", full_name: "John Phiri", mobile: "0881234567" },
    { username: "a.banda", full_name: "Alice Banda", mobile: "0999876543" },
  ];
  for (let i = 0; i < collectorDefs.length; i++) {
    const c = collectorDefs[i];
    await prisma.collector.upsert({
      where: { collector_id: i + 1 },
      update: { full_name: c.full_name, mobile_number: c.mobile },
      create: {
        council_id: council.council_id,
        sub_office_id: limbeOffice.sub_office_id,
        full_name: c.full_name,
        mobile_number: c.mobile,
        username: c.username,
        password_hash: hash,
      },
    });
  }

  // ---------- Supervisor ----------
  await prisma.supervisor.upsert({
    where: { supervisor_id: 1 },
    update: {},
    create: {
      council_id: council.council_id,
      sub_office_id: limbeOffice.sub_office_id,
      full_name: "Mary Banda",
      username: "m.banda",
      password_hash: hash,
    },
  });

  // ---------- Businesses (vendors) ----------
  const rng = makeRng(20260928);
  const businessCount = 48;
  let created = 0;

  for (let i = 0; i < businessCount; i++) {
    const vendorNumber = `V-${String(1001 + i).padStart(5, "0")}`;
    const existing = await prisma.business.findUnique({ where: { vendor_number: vendorNumber } });
    if (existing) continue;

    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const section = sections[i % sections.length];
    const typeName = i % 9 === 0 ? "Kupikulisa Bulk" : i % 11 === 0 ? "Restaurant" : i % 13 === 0 ? "Butchery" : "Market Vendor";

    // Geo-fence algorithm: derive a stable stall position inside the fence.
    const resolved = resolveVendorLocation(vendorNumber, section.section_name, null);

    await prisma.business.create({
      data: {
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
        gps_latitude: resolved.location.lat,
        gps_longitude: resolved.location.lng,
        preferred_wallet: i % 2 === 0 ? "AirtelMoney" : "TNMMpamba",
        wallet_number: `0${8 + (i % 2)}${Math.floor(10000000 + rng() * 89999999)}`,
        status: "Active",
        registration_date: new Date(Date.now() - Math.floor(rng() * 300) * 86400000),
      },
    });
    created++;
  }
  console.log(`Businesses seeded: ${created} new (${businessCount - created} existing).`);

  // ---------- Payments: last 30 days + today ----------
  const businesses = await prisma.business.findMany({ orderBy: { vendor_number: "asc" } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingPayments = await prisma.payment.count();
  let paymentsCreated = 0;

  if (existingPayments < 50) {
    // History: each business gets a few completed payments over past 30 days
    for (const b of businesses) {
      const historyCount = 2 + Math.floor(rng() * 3);
      for (let d = 0; d < historyCount; d++) {
        const day = new Date(today.getTime() - (1 + Math.floor(rng() * 29)) * 86400000);
        day.setHours(7 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
        const fee = Number(
          (await prisma.businessType.findUnique({ where: { business_type_id: b.business_type_id } }))?.fee_amount ?? 300
        );
        const channel = b.preferred_wallet === "AirtelMoney" ? "AirtelMoney" : "TNMMpamba";
        await prisma.payment.create({
          data: {
            business_id: b.business_id,
            collector_id: null,
            amount: fee,
            fee_type: typeNameFor(fee),
            payment_channel: channel,
            transaction_ref: `${channel === "AirtelMoney" ? "AM" : "TM"}-${Date.now().toString(36).toUpperCase()}-${b.business_id}-${d}`,
            status: "Completed",
            paid_at: day,
            created_at: day,
            sms_sent: true,
          },
        });
        paymentsCreated++;
      }
    }

    // Today: ~60% paid, rest unpaid (red dots on the map)
    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      const paid = i % 10 < 6;
      if (!paid) continue;
      const fee = Number(
        (await prisma.businessType.findUnique({ where: { business_type_id: b.business_type_id } }))?.fee_amount ?? 300
      );
      const channel = b.preferred_wallet === "AirtelMoney" ? "AirtelMoney" : "TNMMpamba";
      const at = new Date(today.getTime() + (6 + (i % 8)) * 3600000);
      await prisma.payment.create({
        data: {
          business_id: b.business_id,
          collector_id: i % 3 === 0 ? (i % 2) + 1 : null,
          amount: fee,
          fee_type: typeNameFor(fee),
          payment_channel: i % 3 === 0 ? "Cash" : channel,
          transaction_ref: `${channel === "AirtelMoney" ? "AM" : "TM"}-TODAY-${b.business_id}`,
          status: "Completed",
          paid_at: at,
          created_at: at,
          sms_sent: true,
        },
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
    const agg = await prisma.payment.aggregate({
      where: { paid_at: { gte: day, lt: new Date(day.getTime() + 86400000) }, status: "Completed" },
      _sum: { amount: true },
      _count: true,
    });
    await prisma.revenueSummary.upsert({
      where: { market_id_summary_date: { market_id: limbe.market_id, summary_date: day } },
      update: {
        total_amount: agg._sum.amount ?? 0,
        total_transactions: agg._count,
        successful_count: agg._count,
      },
      create: {
        council_id: council.council_id,
        sub_office_id: limbeOffice.sub_office_id,
        market_id: limbe.market_id,
        summary_date: day,
        total_amount: agg._sum.amount ?? 0,
        total_transactions: agg._count,
        successful_count: agg._count,
      },
    });
  }

  // ---------- API clients: Airtel & TNM ----------
  const clients = [
    { name: "Airtel Money Malawi", email: "api@airtelmw.example", perms: "payments:read,payments:write,webhook:send" },
    { name: "TNM Mpamba", email: "api@tnmmpamba.example", perms: "payments:read,payments:write,webhook:send" },
  ];
  for (const c of clients) {
    const existing = await prisma.apiClient.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.apiClient.create({
        data: {
          council_id: council.council_id,
          name: c.name,
          contact_email: c.email,
          api_keys: {
            create: {
              name: "production",
              key_hash: "seed-placeholder-hash-replace-via-api-management",
              permissions: c.perms,
              rate_limit: 1000,
            },
          },
        },
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
    await prisma.$disconnect();
  });
