import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getScope } from "@/lib/permissions";
import { buildReport, dailyReport, toCsv, type ReportType } from "@/lib/reports";

// GET /api/reports/export?type=daily|monthly|compliance|collectors|revenue
// Streams the report as a CSV download (opens in Excel / LibreOffice and is
// the data source for the Print → Save as PDF view).
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = (request.nextUrl.searchParams.get("type") ?? "") as ReportType;
  const scope = await getScope(user);

  const table =
    type === "daily"
      ? (await dailyReport(scope, request.nextUrl.searchParams.get("date"))).table
      : await buildReport(type, scope);

  if (!table) {
    return NextResponse.json(
      { error: "type must be one of daily, monthly, compliance, collectors, revenue" },
      { status: 400 }
    );
  }

  // BOM keeps MWK symbols and vendor names readable in Excel.
  const csv = `\uFEFF${toCsv(table)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="msika-${table.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
