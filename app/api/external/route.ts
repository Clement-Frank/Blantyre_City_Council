import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API Key required" }, { status: 401 });
    }

    const client = await validateApiKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: "Invalid or expired API Key" }, { status: 401 });
    }

    if (!checkRateLimit(`api_${client.apiClientId}`, client.rateLimit)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const councilId = searchParams.get("council_id");
    const vendorNumber = searchParams.get("vendor_number");

    const where: any = {};
    if (councilId) where.council_id = parseInt(councilId);
    if (vendorNumber) where.vendor_number = vendorNumber;
    if (client.councilId) where.council_id = client.councilId;

    const businesses = await prisma.business.findMany({
      where,
      include: {
        business_type: true,
        market: { select: { name: true } },
        section: { select: { section_name: true } },
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: businesses,
      meta: { count: businesses.length, client: client.clientName },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}