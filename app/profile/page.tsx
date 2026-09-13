import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Building2, Shield, Calendar } from "lucide-react";
import { requireAuth, getDashboardPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AuthNav from "@/components/AuthNav";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  OFFICER: "Staff officer",
  DEPARTMENT_MANAGER: "Department manager",
  ADMIN: "Administrator",
};

export default async function ProfilePage() {
  const sessionUser = await requireAuth("/profile");

  const record = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      department: { select: { name: true } },
    },
  });

  const displayName =
    record?.name ||
    [record?.firstName, record?.lastName].filter(Boolean).join(" ") ||
    "Account";

  return (
    <div className="dashboard-layout">
      <AuthNav user={sessionUser} />

      <main className="dashboard-main">
        <div className="dashboard-container max-w-2xl mx-auto">
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-welcome-title">Your profile</h1>
              <p className="dashboard-welcome-sub">
                Account details used for CivicResolve sign-in and routing.
              </p>
            </div>
            <Link
              href={getDashboardPath(sessionUser.role)}
              className="landing-nav-link-outline"
            >
              Back to dashboard
            </Link>
          </div>

          <section className="profile-card">
            <div className="profile-identity">
              <div className="profile-avatar" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="profile-name">{displayName}</h2>
                <p className="profile-role">
                  {ROLE_LABELS[record?.role ?? sessionUser.role] ??
                    sessionUser.role}
                </p>
              </div>
            </div>

            <dl className="profile-fields">
              <div>
                <dt>
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Email
                </dt>
                <dd>{record?.email ?? sessionUser.email}</dd>
              </div>
              {record?.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>{record.phone}</dd>
                </div>
              )}
              {record?.department?.name && (
                <div>
                  <dt>
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Department
                  </dt>
                  <dd>{record.department.name}</dd>
                </div>
              )}
              <div>
                <dt>
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Role
                </dt>
                <dd>
                  {ROLE_LABELS[record?.role ?? sessionUser.role] ??
                    sessionUser.role}
                </dd>
              </div>
              <div>
                <dt>
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since
                </dt>
                <dd>{formatDate(record?.createdAt)}</dd>
              </div>
              {record?.lastLoginAt && (
                <div>
                  <dt>Last sign-in</dt>
                  <dd>{formatDate(record.lastLoginAt)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}
