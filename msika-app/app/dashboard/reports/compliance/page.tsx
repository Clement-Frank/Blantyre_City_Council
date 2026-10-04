import { redirect } from "next/navigation";

// Vendor compliance analysis lives in the Market Center (MRI tiers +
// enforcement watchlist) — one module, one source of truth.
export default function ComplianceReportRedirect() {
  redirect("/dashboard/markets");
}
