/**
 * CivicResolve — Server-Side Auth Helpers
 *
 * Provides strongly typed, reusable abstractions for:
 *   - Retrieving the current authenticated user
 *   - Requiring authentication (throws/redirects otherwise)
 *   - Requiring a specific role
 *   - Checking permissions via lib/permissions.ts
 *
 * Always use these helpers in Server Components and Route Handlers.
 * Never perform raw session checks scattered across the codebase.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can, type Action, type PermissionComplaint } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import type { SessionUser } from "@/types";

/**
 * Returns the current authenticated user from the session, or null.
 * Safe to call from any Server Component or Route Handler.
 *
 * NEVER expose this user object directly to the client — it may be used
 * for authorization logic and must remain server-side.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) return null;

  // Use type assertion to access augmented session fields
  // The actual runtime values are populated by auth.ts callbacks
  const u = session.user as {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: Role;
    departmentId?: string | null;
  };

  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? null,
    role: (u.role ?? "CITIZEN") as Role,
    departmentId: u.departmentId ?? null,
    image: u.image ?? null,
  };
}

/**
 * Returns the current user or redirects to /login if not authenticated.
 * Use this as the first call in any protected Server Component.
 *
 * @param callbackPath - Optional path to redirect back to after login
 */
export async function requireAuth(callbackPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const loginPath = callbackPath
      ? `/login?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/login";
    redirect(loginPath);
  }

  return user;
}

/**
 * Returns the current user, verifying they have one of the allowed roles.
 * Redirects to /login if unauthenticated, /forbidden if wrong role.
 *
 * @param allowedRoles - One or more roles that are permitted
 */
export async function requireRole(...allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}

/**
 * Checks whether the current user has a specific permission on an optional
 * resource. Returns the user if authorized, redirects to /forbidden otherwise.
 *
 * @param action       - The action to check (from lib/permissions.ts Action type)
 * @param resource     - Optional complaint resource for ownership/dept checks
 */
export async function requirePermission(
  action: Action,
  resource?: PermissionComplaint
): Promise<SessionUser> {
  const user = await requireAuth();

  const permitted = can(
    {
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    },
    action,
    resource
  );

  if (!permitted) {
    redirect("/forbidden");
  }

  return user;
}

/**
 * Convenience: check permission without redirecting.
 * Useful when you want to conditionally render UI elements.
 */
export async function checkPermission(
  action: Action,
  resource?: PermissionComplaint
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    action,
    resource
  );
}

/**
 * Maps a User Role enum string to the corresponding dashboard path.
 */
export function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DEPARTMENT_MANAGER":
      return "/manager/dashboard";
    case "OFFICER":
      return "/staff/dashboard";
    case "CITIZEN":
    default:
      return "/dashboard";
  }
}

