import { redirect } from "next/navigation";

// Collector performance lives in the Market Center collector board —
// one module, one source of truth.
export default function CollectorsReportRedirect() {
  redirect("/dashboard/markets");
}
