/**
 * CivicResolve — Auth.js v5 API Route Handler
 *
 * Mounts the NextAuth GET and POST handlers at:
 *   /api/auth/[...nextauth]
 *
 * This handles:
 *   - /api/auth/session   (GET session)
 *   - /api/auth/csrf      (CSRF token)
 *   - /api/auth/callback  (OAuth callbacks)
 *   - /api/auth/signout   (Sign out)
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Explicitly set Node.js runtime (not Edge) because Prisma runs in Node.
// The middleware uses Edge, but the API route uses the full Node runtime.
export const runtime = "nodejs";

