const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, limit: number = 100): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}