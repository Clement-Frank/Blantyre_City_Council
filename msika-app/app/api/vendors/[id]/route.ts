import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeFilter, paymentScopeFilter } from "@/lib/permissions";

// GET /api/vendors/[id] — vendor profile with payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scope = await getScope(user);
  const business = await prisma.business.findFirst({
    where: {
      AND: [
        { OR: [{ vendor_number: id }, { business_id: Number(id) || 0 }] },
        businessScopeFilter(scope),
      ],
    },
    include: {
      market: true,
      section: true,
      business_type: true,
      registered_by: { select: { full_name: true } },
      payments: {
        where: paymentScopeFilter(scope),
        orderBy: { created_at: "desc" },
        take: 30,
        include: { collector: { select: { full_name: true } } },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
}
