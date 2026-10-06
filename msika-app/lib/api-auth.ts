import { prisma } from "./prisma";
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
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      key_hash: hash,
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    include: { api_client: true },
  });

  if (!apiKey) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { api_key_id: apiKey.api_key_id },
    data: { last_used_at: new Date() },
  });

  return {
    apiClientId: apiKey.api_client_id,
    clientName: apiKey.api_client.name,
    councilId: apiKey.api_client.council_id,
    permissions: parsePermissions(apiKey.permissions),
    rateLimit: apiKey.rate_limit,
  };
}