import { db } from "./db";
import { collectors, supervisors } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
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
    const [collector] = await db
      .select({ collector_id: collectors.collector_id, sub_office_id: collectors.sub_office_id })
      .from(collectors)
      .where(eq(collectors.username, user.username))
      .limit(1);
    return {
      role: "Collector",
      collectorId: collector?.collector_id ?? null,
      supervisorId: null,
      subOfficeId: collector?.sub_office_id ?? null,
    };
  }

  if (user.role === "Supervisor") {
    const [supervisor] = await db
      .select({ supervisor_id: supervisors.supervisor_id, sub_office_id: supervisors.sub_office_id })
      .from(supervisors)
      .where(eq(supervisors.username, user.username))
      .limit(1);
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
 * Business (vendor) filter for a scope, as a composable SQL fragment.
 * Collectors see vendors they registered; supervisors see vendors in their
 * sub-office markets; administrators see all (undefined = no filter).
 *
 * Written as self-contained subqueries so it is safe to embed in any
 * query regardless of the aliases the caller uses.
 */
export function businessScopeSql(
  scope: Scope,
  cols: { registeredBy: PgColumn; marketId: PgColumn }
): SQL | undefined {
  if (scope.role === "Administrator") return undefined;
  if (scope.role === "Collector") {
    if (!scope.collectorId) return sql`false`;
    return eq(cols.registeredBy, scope.collectorId);
  }
  if (scope.role === "Supervisor") {
    if (!scope.subOfficeId) return sql`false`;
    return sql`${cols.marketId} in (select market_id from "Market" where sub_office_id = ${scope.subOfficeId})`;
  }
  return sql`false`;
}

/**
 * Payment filter for a scope, as a composable SQL fragment.
 * Collectors see payments they recorded themselves plus wallet self-payments
 * on vendors they registered; supervisors see payments belonging to vendors
 * in their sub-office; administrators see all (undefined = no filter).
 */
export function paymentScopeSql(
  scope: Scope,
  cols: { collectorId: PgColumn; businessId: PgColumn }
): SQL | undefined {
  if (scope.role === "Administrator") return undefined;
  if (scope.role === "Collector") {
    // A collector's payments: the ones they recorded, plus wallet payments on
    // vendors they registered (self-pay by their own vendors).
    if (!scope.collectorId) return sql`false`;
    return sql`(${cols.collectorId} = ${scope.collectorId} or ${cols.businessId} in (select business_id from "Business" where registered_by_collector_id = ${scope.collectorId}))`;
  }
  if (scope.role === "Supervisor") {
    if (!scope.subOfficeId) return sql`false`;
    return sql`${cols.businessId} in (select b.business_id from "Business" b join "Market" m on m.market_id = b.market_id where m.sub_office_id = ${scope.subOfficeId})`;
  }
  return sql`false`;
}
