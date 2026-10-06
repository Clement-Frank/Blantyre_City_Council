import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiClients, apiKeys } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { generateApiKey, parsePermissions } from "@/lib/api-auth";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "Administrator") {
    return { error: NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 }) };
  }
  return { user };
}

// GET /api/api-clients — real registered API clients and their keys (admin only)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const clientRows = await db.select().from(apiClients).orderBy(asc(apiClients.created_at));
  const keyRows = await db
    .select()
    .from(apiKeys)
    .orderBy(desc(apiKeys.created_at));

  return NextResponse.json({
    clients: clientRows.map((c) => {
      const keys = keyRows.filter((k) => k.api_client_id === c.api_client_id);
      return {
        api_client_id: c.api_client_id,
        name: c.name,
        contact_email: c.contact_email,
        contact_phone: c.contact_phone,
        is_active: c.is_active,
        created_at: c.created_at,
        keys: keys.map((k) => ({
          api_key_id: k.api_key_id,
          name: k.name,
          permissions: parsePermissions(k.permissions),
          rate_limit: k.rate_limit,
          last_used_at: k.last_used_at,
          expires_at: k.expires_at,
          is_active: k.is_active,
          created_at: k.created_at,
        })),
        total_calls: keys.filter((k) => k.last_used_at).length,
      };
    }),
  });
}

// POST /api/api-clients — register a client and mint its first API key.
// The plaintext key is returned ONCE; only its SHA-256 hash is stored.
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json()) as Record<string, string | undefined>;
    const name = body.name?.trim();
    const contact_email = body.contact_email?.trim();
    if (!name || !contact_email) {
      return NextResponse.json({ error: "name and contact_email are required" }, { status: 400 });
    }

    const [client] = await db
      .insert(apiClients)
      .values({ name, contact_email, contact_phone: body.contact_phone?.trim() || null })
      .returning({
        api_client_id: apiClients.api_client_id,
        name: apiClients.name,
      });

    const { plain, hash } = generateApiKey();
    const [key] = await db
      .insert(apiKeys)
      .values({
        api_client_id: client.api_client_id,
        key_hash: hash,
        name: `${name} — default key`,
        permissions: JSON.stringify(["payments:write", "vendors:read"]),
      })
      .returning({ api_key_id: apiKeys.api_key_id });

    return NextResponse.json({
      success: true,
      client: { api_client_id: client.api_client_id, name: client.name },
      api_key: {
        api_key_id: key.api_key_id,
        plaintext: plain, // shown once — never stored or returned again
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to register client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/api-clients — toggle a key or client active state
export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json()) as { api_key_id?: number; api_client_id?: number; is_active?: boolean };
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active (boolean) is required" }, { status: 400 });
    }

    if (body.api_key_id) {
      const [key] = await db
        .update(apiKeys)
        .set({ is_active: body.is_active })
        .where(eq(apiKeys.api_key_id, Number(body.api_key_id)))
        .returning({ api_key_id: apiKeys.api_key_id, is_active: apiKeys.is_active });
      return NextResponse.json({ success: true, key });
    }

    if (body.api_client_id) {
      const [client] = await db
        .update(apiClients)
        .set({ is_active: body.is_active })
        .where(eq(apiClients.api_client_id, Number(body.api_client_id)))
        .returning({ api_client_id: apiClients.api_client_id, is_active: apiClients.is_active });
      return NextResponse.json({ success: true, client });
    }

    return NextResponse.json({ error: "api_key_id or api_client_id is required" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
