/**
 * CivicResolve — Route role-access helpers (Edge-safe, pure)
 *
 * Used by middleware for defense-in-depth page gates.
 * Server actions / APIs remain the authoritative authorization layer.
 */

import type { Role } from "@prisma/client";

export const KNOWN_ROLES: readonly Role[] = [
  "CITIZEN",
  "OFFICER",
  "DEPARTMENT_MANAGER",
  "ADMIN",
] as const;

export function isKnownRole(role: unknown): role is Role {
  return (
    typeof role === "string" &&
    (KNOWN_ROLES as readonly string[]).includes(role)
  );
}

/**
 * Whether an authenticated user's role may access a route with the given
 * allowed-role list.
 *
 * - `allowedRoles` empty → any authenticated user (caller still requires auth)
 * - missing / unknown role → denied when the route is role-restricted
 * - known role not in list → denied
 */
export function isAuthorizedForRouteRoles(
  userRole: unknown,
  allowedRoles: Role[]
): boolean {
  if (allowedRoles.length === 0) return true;
  if (!isKnownRole(userRole)) return false;
  return allowedRoles.includes(userRole);
}
