import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, marketSections, markets, subOffices } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";

// GET /api/markets — markets with sections and counts (admin/supervisor)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "Collector") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const marketRows = await db
    .select({
      market_id: markets.market_id,
      council_id: markets.council_id,
      sub_office_id: markets.sub_office_id,
      name: markets.name,
      location: markets.location,
      vendor_count: sql<number>`(select count(*)::int from ${businesses} where ${businesses.market_id} = ${markets.market_id})`,
    })
    .from(markets)
    .orderBy(asc(markets.market_id));
  const sectionRows = await db.select().from(marketSections);
  const subOfficeRows = await db
    .select({
      sub_office_id: subOffices.sub_office_id,
      name: subOffices.name,
      location: subOffices.location,
    })
    .from(subOffices)
    .orderBy(asc(subOffices.name));

  return NextResponse.json({
    markets: marketRows.map((m) => ({
      market_id: m.market_id,
      council_id: m.council_id,
      sub_office_id: m.sub_office_id,
      name: m.name,
      location: m.location,
      sections: sectionRows.filter((s) => s.market_id === m.market_id),
      _count: { businesses: m.vendor_count },
    })),
    sub_offices: subOfficeRows,
  });
}

// POST /api/markets — create a market or a section (admin only)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, location, sub_office_id, section_name, market_id } = body as Record<string, string | number | undefined>;
    const nameStr = name != null ? String(name) : "";
    const locationStr = location != null ? String(location) : "";
    const sectionNameStr = section_name != null ? String(section_name) : "";

    // Adding a section to an existing market
    if (market_id && sectionNameStr) {
      const [market] = await db
        .select()
        .from(markets)
        .where(eq(markets.market_id, Number(market_id)))
        .limit(1);
      if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

      const [section] = await db
        .insert(marketSections)
        .values({ market_id: market.market_id, section_name: sectionNameStr })
        .returning();
      return NextResponse.json({ success: true, section });
    }

    // Creating a new market
    if (!nameStr || !sub_office_id) {
      return NextResponse.json({ error: "name and sub_office_id are required" }, { status: 400 });
    }

    const [subOffice] = await db
      .select()
      .from(subOffices)
      .where(eq(subOffices.sub_office_id, Number(sub_office_id)))
      .limit(1);
    if (!subOffice) return NextResponse.json({ error: "Sub office not found" }, { status: 404 });

    const [market] = await db
      .insert(markets)
      .values({
        council_id: subOffice.council_id,
        sub_office_id: subOffice.sub_office_id,
        name: nameStr,
        location: locationStr,
      })
      .returning();

    return NextResponse.json({ success: true, market });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
