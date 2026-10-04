import { redirect } from "next/navigation";

// Monthly revenue trends are on the main dashboard (RevenueChart) —
// one module, one source of truth.
export default function MonthlyReportRedirect() {
  redirect("/dashboard");
}
