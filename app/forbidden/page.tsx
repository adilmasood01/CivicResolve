/**
 * CivicResolve — Forbidden Page (403)
 *
 * Shown when an authenticated user tries to access a resource
 * they are not authorized to view.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Access Denied",
};

function getDashboardForRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DEPARTMENT_MANAGER":
      return "/manager/dashboard";
    case "OFFICER":
      return "/staff/dashboard";
    default:
      return "/dashboard";
  }
}

export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  const dashboardPath = user ? getDashboardForRole(user.role) : "/login";

  return (
    <div className="error-page">
      <div className="error-page-inner">
        <p className="error-code">403</p>
        <h1 className="error-title">Access denied</h1>
        <p className="error-body">
          You don&apos;t have permission to view this page.
          {user && (
            <>
              {" "}
              Your current role is{" "}
              <span className="error-role">
                {user.role.replace(/_/g, " ").toLowerCase()}
              </span>
              .
            </>
          )}
        </p>
        <div className="error-actions">
          <Link href={dashboardPath} className="landing-nav-link-primary">
            {user ? "Go to my dashboard" : "Sign in"}
          </Link>
          <Link href="/" className="landing-nav-link-outline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
