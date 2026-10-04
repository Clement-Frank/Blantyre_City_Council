import { redirect } from "next/navigation";

// Businesses and Vendors were previously two overlapping modules. Everything
// business-related (profiles, types, fees, locations, payment status) now lives
// in the single Vendors module — this route redirects for old bookmarks.
export default function BusinessesPage() {
  redirect("/dashboard/vendors");
}
