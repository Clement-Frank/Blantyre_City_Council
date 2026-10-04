import { redirect } from "next/navigation";

// Revenue trends are on the main dashboard (RevenueChart) — one module,
// one source of truth.
export default function RevenueReportRedirect() {
  redirect("/dashboard");
}
