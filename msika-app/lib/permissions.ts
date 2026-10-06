import { prisma } from "./prisma";
import type { SessionUser } from "./session";

/**
 * Role-based access control for Msika.
 *
 * Scoping policy ("only see what belongs to me"):
 *  - Administrator → everything
 *  - Supervisor    → data within their sub-office (vendors + payments in markets
 *                    under that sub-office)
 *  - Collector     → vendors they registered + payments they recorded
 *  - anything else → nothing (empty result sets, writes rejected)
 */

export interface Scope {
  role: string;
  /** id in the Collector table (role Collector) */
  collectorId: number | null;
  /** id in the Supervisor table (role Supervisor) */
  supervisorId: number | null;
  /** sub-office the user is attached to (Collector or Supervisor) */
  subOfficeId: number | null;
}

/** The scope of a user with no valid session — sees nothing. */
export const EMPTY_SCOPE: Scope = {
  role: "",
  collectorId: null,
  supervisorId: null,
  subOfficeId: null,
};

/** Resolve the DB identity (collector/supervisor id, sub-office) for a session user. */
export async function getScope(user: SessionUser): Promise<Scope> {
  if (!user) return EMPTY_SCOPE;

  if (user.role === "Administrator") {
    return { role: "Administrator", collectorId: null, supervisorId: null, subOfficeId: null };
  }

  if (user.role === "Collector") {
    const collector = await prisma.collector.findUnique({
      where: { username: user.username },
      select: { collector_id: true, sub_office_id: true },
    });
    return {
      role: "Collector",
      collectorId: collector?.collector_id ?? null,
      supervisorId: null,
      subOfficeId: collector?.sub_office_id ?? null,
    };
  }

  if (user.role === "Supervisor") {
    const supervisor = await prisma.supervisor.findUnique({
      where: { username: user.username },
      select: { supervisor_id: true, sub_office_id: true },
    });
    return {
      role: "Supervisor",
      collectorId: null,
      supervisorId: supervisor?.supervisor_id ?? null,
      subOfficeId: supervisor?.sub_office_id ?? null,
    };
  }

  return EMPTY_SCOPE;
}

/**
 * Business (vendor) filter for a scope.
 * Collectors see vendors they registered; supervisors see vendors in their
 * sub-office markets; administrators see all.
 */
export function businessScopeFilter(scope: Scope): Record<string, unknown> {
  if (scope.role === "Administrator") return {};
  if (scope.role === "Collector") {
    if (!scope.collectorId) return { business_id: -1 };
    return { registered_by_collector_id: scope.collectorId };
  }
  if (scope.role === "Supervisor") {
    if (!scope.subOfficeId) return { business_id: -1 };
    return { market: { sub_office_id: scope.subOfficeId } };
  }
  return { business_id: -1 };
}

/**
 * Payment filter for a scope.
 * Collectors see payments they recorded themselves; supervisors see payments
 * belonging to vendors in their sub-office; administrators see all.
 */
export function paymentScopeFilter(scope: Scope): Record<string, unknown> {
  if (scope.role === "Administrator") return {};
  if (scope.role === "Collector") {
    // A collector's payments: the ones they recorded, plus wallet payments on
    // vendors they registered (self-pay by their own vendors).
    if (scope.collectorId) {
      return {
        OR: [
          { collector_id: scope.collectorId },
          { business: { registered_by_collector_id: scope.collectorId } },
        ],
      };
    }
    return { payment_id: -1 };
  }
  if (scope.role === "Supervisor") {
    if (scope.subOfficeId) {
      return { business: { market: { sub_office_id: scope.subOfficeId } } };
    }
    return { payment_id: -1 };
  }
  return { payment_id: -1 };
}
