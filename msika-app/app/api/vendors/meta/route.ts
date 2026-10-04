import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/vendors/meta — reference data for the vendor registration form:
// business types (with fees) and markets + sections.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [types, markets] = await Promise.all([
    prisma.businessType.findMany({
      select: { business_type_id: true, name: true, fee_amount: true },
      orderBy: { fee_amount: "asc" },
    }),
    prisma.market.findMany({
      select: {
        market_id: true,
        name: true,
        sections: { select: { section_id: true, section_name: true }, orderBy: { section_name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    types: types.map((t) => ({
      business_type_id: t.business_type_id,
      name: t.name,
      fee_amount: Number(t.fee_amount),
    })),
    markets,
  });
}
