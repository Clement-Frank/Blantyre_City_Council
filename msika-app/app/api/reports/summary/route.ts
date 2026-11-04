import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getScope } from "@/lib/permissions";
import { buildReport, dailyReport, type ReportType } from "@/lib/reports";

// GET /api/reports/summary?type=monthly|compliance|collectors|revenue|daily&date=YYYY-MM-DD
// Live, role-scoped report data for the report pages.
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = (request.nextUrl.searchParams.get("type") ?? "") as ReportType;
  const scope = await getScope(user);

  if (type === "daily") {
    const { detail } = await dailyReport(scope, request.nextUrl.searchParams.get("date"));
    return NextResponse.json(detail);
  }

  const table = await buildReport(type, scope);
  if (!table) {
    return NextResponse.json(
      { error: "type must be one of daily, monthly, compliance, collectors, revenue" },
      { status: 400 }
    );
  }

  return NextResponse.json(table);
}
