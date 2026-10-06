import { db } from "./db";
import { apiClients, apiKeys } from "@/src/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import crypto from "crypto";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { plain: string; hash: string } {
  const plain = `msika_${crypto.randomBytes(32).toString("hex")}`;
  const hash = hashApiKey(plain);
  return { plain, hash };
}

// Permissions are stored as a JSON array string, but some seeded rows use a
// legacy comma-separated format — accept both so neither the external API
// nor the admin UI crashes on old data.
export function parsePermissions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function validateApiKey(key: string) {
  const hash = hashApiKey(key);
  const [apiKey] = await db
    .select({
      api_key_id: apiKeys.api_key_id,
      api_client_id: apiKeys.api_client_id,
      permissions: apiKeys.permissions,
      rate_limit: apiKeys.rate_limit,
      client_name: apiClients.name,
      client_council_id: apiClients.council_id,
    })
    .from(apiKeys)
    .innerJoin(apiClients, eq(apiClients.api_client_id, apiKeys.api_client_id))
    .where(
      and(
        eq(apiKeys.key_hash, hash),
        eq(apiKeys.is_active, true),
        or(isNull(apiKeys.expires_at), gt(apiKeys.expires_at, new Date()))
      )
    )
    .limit(1);

  if (!apiKey) return null;

  // Update last used
  await db
    .update(apiKeys)
    .set({ last_used_at: new Date() })
    .where(eq(apiKeys.api_key_id, apiKey.api_key_id));

  return {
    apiClientId: apiKey.api_client_id,
    clientName: apiKey.client_name,
    councilId: apiKey.client_council_id,
    permissions: parsePermissions(apiKey.permissions),
    rateLimit: apiKey.rate_limit,
  };
}
