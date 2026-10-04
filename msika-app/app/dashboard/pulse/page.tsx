import { redirect } from "next/navigation";

// Market Pulse has been merged into the Limbe Market Command Center
// (/dashboard/markets) — one module, one engine, no duplicated stats.
export default function PulsePage() {
  redirect("/dashboard/markets");
}
