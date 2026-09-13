/**
 * CivicResolve — Forbidden Page (403)
 *
 * Shown when an authenticated user tries to access a resource
 * they are not authorized to view.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Access Denied",
};

function getDashboardForRole(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "DEPARTMENT_MANAGER": return "/manager/dashboard";
    case "OFFICER": return "/staff/dashboard";
    default: return "/dashboard";
  }
}

export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  const dashboardPath = user ? getDashboardForRole(user.role) : "/login";

  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-icon-wrap">
          <ShieldX className="forbidden-icon" aria-hidden="true" />
        </div>
        <h1 className="forbidden-title">Access Denied</h1>
        <p className="forbidden-body">
          You don&apos;t have permission to view this page.
          {user && (
            <>
              {" "}Your current role is{" "}
              <strong className="forbidden-role">{user.role.replace(/_/g, " ")}</strong>.
            </>
          )}
        </p>
        <div className="forbidden-actions">
          <Link href={dashboardPath} className="forbidden-btn-primary">
            Go to my dashboard
          </Link>
          <Link href="/" className="forbidden-btn-outline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
