/**
 * CivicResolve — Next.js Middleware (Auth.js v5)
 *
 * Runs on the Edge Runtime. Protects routes based on authentication state
 * and role. Does NOT use Prisma (Edge incompatible) — reads JWT only.
 *
 * Route protection matrix:
 *   /dashboard, /complaints/*, /notifications, /profile  → any authenticated user
 *   /staff/*                                             → OFFICER | DEPARTMENT_MANAGER | ADMIN
 *   /manager/*                                           → DEPARTMENT_MANAGER | ADMIN
 *   /admin/*                                             → ADMIN only
 *   /login, /register                                   → redirect to dashboard if already authed
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

// Route → minimum required roles (empty array = any authenticated user)
const PROTECTED_ROUTES: Array<{
  pattern: RegExp;
  roles: Role[];
}> = [
  { pattern: /^\/admin(\/|$)/, roles: ["ADMIN"] },
  {
    pattern: /^\/manager(\/|$)/,
    roles: ["DEPARTMENT_MANAGER", "ADMIN"],
  },
  {
    pattern: /^\/staff(\/|$)/,
    roles: ["OFFICER", "DEPARTMENT_MANAGER", "ADMIN"],
  },
  {
    pattern:
      /^\/(dashboard|complaints|notifications|profile)(\/|$)/,
    roles: [],
  },
];

// Guest-only routes: authenticated users should be redirected away
const GUEST_ONLY_ROUTES = /^\/(login|register)(\/|$)/;

function getDashboardForRole(role: Role): string {
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

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  // Access role via type assertion — populated by the jwt callback in auth.ts
  const userRole = (session?.user as { role?: Role } | undefined)?.role;

  // Redirect authenticated users away from guest-only pages
  if (GUEST_ONLY_ROUTES.test(pathname) && session?.user) {
    const destination = getDashboardForRole(userRole ?? "CITIZEN");
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // Check protected routes
  for (const route of PROTECTED_ROUTES) {
    if (!route.pattern.test(pathname)) continue;

    // Not authenticated → redirect to login with callbackUrl
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check (empty array = any authenticated role)
    if (route.roles.length > 0 && userRole && !route.roles.includes(userRole)) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    break; // First matching route wins
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - api/auth (NextAuth routes — must not be intercepted)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};
