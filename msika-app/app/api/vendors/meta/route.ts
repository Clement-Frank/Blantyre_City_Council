import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessTypes, marketSections, markets } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";

// GET /api/vendors/meta — reference data for the vendor registration form:
// business types (with fees) and markets + sections.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [types, marketRows, sectionRows] = await Promise.all([
    db
      .select({
        business_type_id: businessTypes.business_type_id,
        name: businessTypes.name,
        fee_amount: businessTypes.fee_amount,
      })
      .from(businessTypes)
      .orderBy(asc(businessTypes.fee_amount)),
    db
      .select({ market_id: markets.market_id, name: markets.name })
      .from(markets)
      .orderBy(asc(markets.name)),
    db
      .select({
        section_id: marketSections.section_id,
        market_id: marketSections.market_id,
        section_name: marketSections.section_name,
      })
      .from(marketSections)
      .orderBy(asc(marketSections.section_name)),
  ]);

  return NextResponse.json({
    types: types.map((t) => ({
      business_type_id: t.business_type_id,
      name: t.name,
      fee_amount: Number(t.fee_amount),
    })),
    markets: marketRows.map((m) => ({
      market_id: m.market_id,
      name: m.name,
      sections: sectionRows
        .filter((s) => s.market_id === m.market_id)
        .map((s) => ({ section_id: s.section_id, section_name: s.section_name })),
    })),
  });
}
