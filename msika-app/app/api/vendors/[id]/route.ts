import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses as businessesTable,
  businessTypes,
  collectors,
  marketSections,
  markets,
  payments as paymentsTable,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";

// GET /api/vendors/[id] — vendor profile with payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scope = await getScope(user);

  const bizScope = businessScopeSql(scope, {
    registeredBy: businessesTable.registered_by_collector_id,
    marketId: businessesTable.market_id,
  });
  const idCondition = or(
    eq(businessesTable.vendor_number, id),
    eq(businessesTable.business_id, Number(id) || 0)
  );

  const [business] = await db
    .select({
      business_id: businessesTable.business_id,
      vendor_number: businessesTable.vendor_number,
      council_id: businessesTable.council_id,
      market_id: businessesTable.market_id,
      section_id: businessesTable.section_id,
      business_type_id: businessesTable.business_type_id,
      registered_by_collector_id: businessesTable.registered_by_collector_id,
      business_name: businessesTable.business_name,
      owner_name: businessesTable.owner_name,
      phone_number: businessesTable.phone_number,
      national_id: businessesTable.national_id,
      email: businessesTable.email,
      block: businessesTable.block,
      stall_number: businessesTable.stall_number,
      gps_latitude: businessesTable.gps_latitude,
      gps_longitude: businessesTable.gps_longitude,
      preferred_wallet: businessesTable.preferred_wallet,
      wallet_number: businessesTable.wallet_number,
      status: businessesTable.status,
      registration_date: businessesTable.registration_date,
      market: {
        market_id: markets.market_id,
        council_id: markets.council_id,
        sub_office_id: markets.sub_office_id,
        name: markets.name,
        location: markets.location,
      },
      section: {
        section_id: marketSections.section_id,
        market_id: marketSections.market_id,
        section_name: marketSections.section_name,
      },
      type_name: businessTypes.name,
      type_description: businessTypes.description,
      type_fee_amount: businessTypes.fee_amount,
      registered_by_name: collectors.full_name,
    })
    .from(businessesTable)
    .leftJoin(markets, eq(markets.market_id, businessesTable.market_id))
    .leftJoin(marketSections, eq(marketSections.section_id, businessesTable.section_id))
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businessesTable.business_type_id))
    .leftJoin(collectors, eq(collectors.collector_id, businessesTable.registered_by_collector_id))
    .where(bizScope ? and(idCondition, bizScope) : idCondition)
    .limit(1);

  if (!business || business.business_id == null) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const paymentRows = await db
    .select({
      payment_id: paymentsTable.payment_id,
      business_id: paymentsTable.business_id,
      collector_id: paymentsTable.collector_id,
      amount: paymentsTable.amount,
      fee_type: paymentsTable.fee_type,
      payment_channel: paymentsTable.payment_channel,
      transaction_ref: paymentsTable.transaction_ref,
      provider_ref: paymentsTable.provider_ref,
      status: paymentsTable.status,
      paid_at: paymentsTable.paid_at,
      created_at: paymentsTable.created_at,
      sms_sent: paymentsTable.sms_sent,
      receipt_generated: paymentsTable.receipt_generated,
      collector_name: collectors.full_name,
    })
    .from(paymentsTable)
    .leftJoin(collectors, eq(collectors.collector_id, paymentsTable.collector_id))
    .where(
      and(
        eq(paymentsTable.business_id, business.business_id),
        paymentScopeSql(scope, {
          collectorId: paymentsTable.collector_id,
          businessId: paymentsTable.business_id,
        }) ?? sql`true`
      )
    )
    .orderBy(desc(paymentsTable.created_at))
    .limit(30);

  return NextResponse.json({
    business: {
      ...business,
      business_type: {
        business_type_id: business.business_type_id,
        name: business.type_name,
        description: business.type_description,
        fee_amount: business.type_fee_amount,
      },
      registered_by: { full_name: business.registered_by_name },
      payments: paymentRows.map((p) => ({
        payment_id: p.payment_id,
        business_id: p.business_id,
        collector_id: p.collector_id,
        amount: p.amount,
        fee_type: p.fee_type,
        payment_channel: p.payment_channel,
        transaction_ref: p.transaction_ref,
        provider_ref: p.provider_ref,
        status: p.status,
        paid_at: p.paid_at,
        created_at: p.created_at,
        sms_sent: p.sms_sent,
        receipt_generated: p.receipt_generated,
        collector: p.collector_name != null ? { full_name: p.collector_name } : null,
      })),
    },
  });
}
