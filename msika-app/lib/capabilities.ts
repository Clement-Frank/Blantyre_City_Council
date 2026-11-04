// ============================================================
// Capability matrix — client-safe (no Prisma import).
// Shared by server routes (enforcement) and dashboard UI (what to show).
// ------------------------------------------------------------
// Separation of duties: the Administrator oversees the system — staff
// accounts, API clients, audit trail, reports, the live map — but does NOT
// perform field operations. Cash collection and vendor enrolment belong to
// Collectors and Supervisors, so every cedi/mwk collected is attributable to
// an officer who was physically at the stall.
// ============================================================

export type Capability =
  | "record_payment"
  | "register_vendor"
  | "manage_users"
  | "manage_api_clients"
  | "view_audit"
  | "view_reports"
  | "view_map";

const CAPABILITIES: Record<string, Capability[]> = {
  Administrator: ["manage_users", "manage_api_clients", "view_audit", "view_reports", "view_map"],
  Supervisor: ["record_payment", "register_vendor", "view_reports", "view_map"],
  Collector: ["record_payment", "register_vendor", "view_map"],
};

/** Can this role perform the capability? Unknown roles can do nothing. */
export function can(role: string | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[role] ?? []).includes(capability);
}

/** Human-readable reason shown when a capability is refused. */
export const CAPABILITY_DENIED: Record<Capability, string> = {
  record_payment:
    "Administrators cannot record payments — cash is collected and recorded by collectors and supervisors",
  register_vendor:
    "Administrators cannot enrol vendors — registration is done in the field by collectors and supervisors",
  manage_users: "Only administrators manage staff accounts",
  manage_api_clients: "Only administrators manage API clients",
  view_audit: "Only administrators can read the audit trail",
  view_reports: "Reports are available to all signed-in staff",
  view_map: "The live map is available to all signed-in staff",
};
