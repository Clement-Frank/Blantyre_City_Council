import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/setup/types — business types with fees (for registration forms)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await prisma.businessType.findMany({
    orderBy: { fee_amount: "asc" },
  });

  return NextResponse.json({ types });
}
