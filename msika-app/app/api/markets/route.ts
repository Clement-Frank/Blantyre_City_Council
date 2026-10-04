import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/markets — markets with sections and counts (admin/supervisor)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "Collector") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const [markets, subOffices] = await Promise.all([
    prisma.market.findMany({
      include: {
        sections: true,
        _count: { select: { businesses: true } },
      },
      orderBy: { market_id: "asc" },
    }),
    prisma.subOffice.findMany({
      select: { sub_office_id: true, name: true, location: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ markets, sub_offices: subOffices });
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
      const market = await prisma.market.findUnique({ where: { market_id: Number(market_id) } });
      if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

      const section = await prisma.marketSection.create({
        data: { market_id: market.market_id, section_name: sectionNameStr },
      });
      return NextResponse.json({ success: true, section });
    }

    // Creating a new market
    if (!nameStr || !sub_office_id) {
      return NextResponse.json({ error: "name and sub_office_id are required" }, { status: 400 });
    }

    const subOffice = await prisma.subOffice.findUnique({ where: { sub_office_id: Number(sub_office_id) } });
    if (!subOffice) return NextResponse.json({ error: "Sub office not found" }, { status: 404 });

    const market = await prisma.market.create({
      data: {
        council_id: subOffice.council_id,
        sub_office_id: subOffice.sub_office_id,
        name: nameStr,
        location: locationStr,
      },
    });

    return NextResponse.json({ success: true, market });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
