import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatStrip } from "@/components/layout/StatStrip";
import { EmptyState } from "@/components/layout/EmptyState";
import { getDepartmentAnalytics } from "@/services/analytics.service";
import {
  ComplaintTrendChart,
  CategoryPieChart,
} from "@/components/analytics/AnalyticsCharts";
import { Download, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Department Analytics | CivicResolve Manager",
  description: "Operational metrics and officer performance for your department.",
};

export default async function ManagerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (user.role !== "DEPARTMENT_MANAGER" || !user.departmentId) {
    return (
      <AppShell user={user}>
        <EmptyState
          title="You don't have permission to view this page"
          description="Department manager access is required for analytics."
          action={
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Go home
            </Link>
          }
        />
      </AppShell>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;
  const data = await getDepartmentAnalytics(user, user.departmentId, { range });

  const ranges = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
  ];

  return (
    <AppShell user={user}>
      <PageHeader
        title={`${data.department.name} analytics`}
        description="Workload, SLA compliance, and resolution performance for your department."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {ranges.map((r) => (
              <Link
                key={r.key}
                href={`/manager/analytics?range=${r.key}`}
                className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium ${
                  range === r.key
                    ? "border-primary bg-[var(--cr-primary-muted)] text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {r.label}
              </Link>
            ))}
            <a
              href="/api/reports/complaints/csv"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </a>
            <a
              href="/api/reports/departments/pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </a>
          </div>
        }
      />

      <StatStrip
        className="mb-8"
        items={[
          { label: "Total complaints", value: data.kpis.totalComplaints },
          {
            label: "Resolution rate",
            value: `${data.kpis.resolutionRatePercent}%`,
            tone: "success",
          },
          {
            label: "SLA compliance",
            value: `${data.kpis.slaCompliancePercent}%`,
            tone: "info",
          },
          {
            label: "Active breaches",
            value: data.kpis.slaBreaches,
            tone: data.kpis.slaBreaches > 0 ? "danger" : "default",
          },
        ]}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Complaint volume</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Submitted vs resolved over the selected timeframe.
          </p>
          <ComplaintTrendChart data={data.trend} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">By category</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Share of complaints across categories.
          </p>
          <CategoryPieChart data={data.categoryDist} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Officer workload ({data.officerWorkload.length})
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {data.officerWorkload.length === 0 ? (
            <EmptyState
              title="No officer workload data"
              description="Assigned officers will appear here once cases are allocated."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Officer</th>
                    <th className="px-3 py-2.5 font-medium">Assigned</th>
                    <th className="px-3 py-2.5 font-medium">Open</th>
                    <th className="px-3 py-2.5 font-medium">Resolved</th>
                    <th className="px-3 py-2.5 font-medium">Breached</th>
                    <th className="px-3 py-2.5 font-medium">Avg resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.officerWorkload.map((o) => (
                    <tr key={o.officerId} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {o.officerName}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{o.totalAssigned}</td>
                      <td className="px-3 py-2.5 tabular-nums text-[var(--cr-warn)]">
                        {o.openComplaints}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-[var(--cr-success)]">
                        {o.resolvedComplaints}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-[var(--cr-danger)]">
                        {o.breachedComplaints}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {o.avgResolutionHours} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
