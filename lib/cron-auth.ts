/**
 * CivicResolve — Cron shared-secret verification (fail-closed)
 */

import { timingSafeEqual } from "crypto";

/**
 * Constant-time string compare for secrets of equal length.
 * Different lengths return false without leaking via timingSafeEqual throw.
 */
export function safeEqualSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Resolve configured CRON_SECRET. Returns null if unset/empty (fail-closed).
 * Never logs the secret value.
 */
export function getConfiguredCronSecret(): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret || !secret.trim()) return null;
  return secret.trim();
}

/**
 * Extract bearer or x-cron-secret from a request.
 */
export function extractCronSecretFromRequest(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cronSecretHeader = req.headers.get("x-cron-secret");
  if (cronSecretHeader) return cronSecretHeader.trim();
  return "";
}

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Authorize SLA cron callers. Fail closed when CRON_SECRET is not configured.
 */
export function authorizeCronRequest(req: Request): CronAuthResult {
  const expected = getConfiguredCronSecret();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "SLA cron is not configured",
    };
  }

  const provided = extractCronSecretFromRequest(req);
  if (!provided || !safeEqualSecret(provided, expected)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
    };
  }

  return { ok: true };
}
