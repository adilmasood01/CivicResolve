import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardStats } from "@/services/admin.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { StatStrip } from "@/components/layout/StatStrip";
import { AlertTriangle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "System Administration Dashboard",
};

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const stats = await getAdminDashboardStats(user);

  const { overview, systemHealth, departmentSummaries } = stats;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Control center"
        description={`Welcome back, ${user.name ?? user.email} — system health and department overview.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Audit trail
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Manage users
            </Link>
          </div>
        }
      />

      <div className="space-y-3">
        <StatStrip
          items={[
            { label: "Submitted today", value: systemHealth.submittedToday },
            {
              label: "Resolved today",
              value: systemHealth.resolvedToday,
              tone: "success",
            },
            {
              label: "Breached SLAs",
              value: systemHealth.currentlyBreached,
              tone: systemHealth.currentlyBreached > 0 ? "danger" : "default",
            },
            {
              label: "Unassigned",
              value: systemHealth.unassignedComplaints,
              tone: systemHealth.unassignedComplaints > 0 ? "warn" : "default",
              hint:
                systemHealth.unresolvedCritical > 0
                  ? `${systemHealth.unresolvedCritical} critical unresolved`
                  : undefined,
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          <span className="tabular-nums">{overview.totalCitizens}</span> citizens
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.totalOfficers}</span> officers
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.totalManagers}</span> managers
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.totalDepartments}</span> departments
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.totalCategories}</span> categories
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.openComplaints}</span> open /{" "}
          <span className="tabular-nums">{overview.totalComplaints}</span> total complaints
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.resolvedComplaints}</span> resolved
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{overview.breachedSLAs}</span> SLA breaches
        </p>
      </div>

      <Section
        title="Department performance"
        description="Complaints, staffing, and SLA across departments."
        actions={
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Manage departments
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Department</th>
                  <th className="px-3 py-2.5 font-medium">Code</th>
                  <th className="px-3 py-2.5 font-medium">Manager</th>
                  <th className="px-3 py-2.5 text-center font-medium">Officers</th>
                  <th className="px-3 py-2.5 text-center font-medium">Total</th>
                  <th className="px-3 py-2.5 text-center font-medium">Open</th>
                  <th className="px-3 py-2.5 text-center font-medium">Resolved</th>
                  <th className="px-3 py-2.5 text-center font-medium">SLA breaches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentSummaries.map((dept) => (
                  <tr key={dept.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {dept.name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {dept.managerName}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-foreground">
                      {dept.officersCount}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-foreground">
                      {dept.totalComplaints}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-[var(--cr-warn)]">
                      {dept.openComplaints}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-[var(--cr-success)]">
                      {dept.resolvedComplaints}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {dept.slaBreaches > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-[var(--cr-danger)]">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          {dept.slaBreaches}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <nav
        aria-label="Quick actions"
        className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm"
      >
        <Link href="/admin/users" className="text-primary hover:underline">
          Users
        </Link>
        <Link href="/admin/departments" className="text-muted-foreground hover:text-foreground">
          Departments
        </Link>
        <Link href="/admin/categories" className="text-muted-foreground hover:text-foreground">
          Categories
        </Link>
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground">
          Analytics
        </Link>
        <Link href="/admin/audit-logs" className="text-muted-foreground hover:text-foreground">
          Audit logs
        </Link>
        <Link href="/admin/sla" className="text-muted-foreground hover:text-foreground">
          SLA rules
        </Link>
      </nav>
    </div>
  );
}
