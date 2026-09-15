import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminAnalyticsNav } from "@/components/admin/AdminAnalyticsNav";
import { PageHeader } from "@/components/layout";
import {
  getSystemKPIs,
  getComplaintTrends,
  getStatusDistribution,
  getPriorityDistribution,
  getCategoryDistribution,
} from "@/services/analytics.service";
import {
  ComplaintTrendChart,
  DistributionBarChart,
  CategoryPieChart,
} from "@/components/analytics/AnalyticsCharts";
import { FileText, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Executive Analytics | CivicResolve Admin",
  description: "Comprehensive executive complaint, SLA, and department operational analytics.",
};

export default async function AdminAnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (!can(user, "analytics:view-system")) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          You don&apos;t have permission to view system analytics.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;

  const dateOptions = { range };

  const [kpis, trend, statusDist, priorityDist, categoryDist] = await Promise.all([
    getSystemKPIs(user, dateOptions),
    getComplaintTrends(user, dateOptions),
    getStatusDistribution(user, dateOptions),
    getPriorityDistribution(user, dateOptions),
    getCategoryDistribution(user, dateOptions),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Analytics"
        description="Real-time operational performance, resolution rates, and SLA compliance."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 text-xs font-medium">
              {["7d", "30d", "90d", "6m", "12m"].map((r) => (
                <Link
                  key={r}
                  href={`/admin/analytics?range=${r}`}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    range === r
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.toUpperCase()}
                </Link>
              ))}
            </div>

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
              href="/api/reports/complaints/pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </a>
          </>
        }
      />

      <AdminAnalyticsNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1 rounded-lg border border-border bg-card px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">Total complaints</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{kpis.totalComplaints}</p>
          <p className="text-[11px] text-muted-foreground">In selected range</p>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">Resolution rate</p>
          <p className="text-xl font-semibold tabular-nums text-[var(--cr-success)]">
            {kpis.resolutionRatePercent}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {kpis.resolvedComplaints} resolved · {kpis.openComplaints} open
          </p>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">SLA compliance</p>
          <p className="text-xl font-semibold tabular-nums text-primary">
            {kpis.slaCompliancePercent}%
          </p>
          <p className="text-[11px] text-muted-foreground">Resolved within deadline</p>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">Active breaches</p>
          <p className="text-xl font-semibold tabular-nums text-[var(--cr-danger)]">
            {kpis.slaBreaches}
          </p>
          <p className="text-[11px] text-muted-foreground">Past SLA, still open</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5 lg:col-span-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Complaint volume</h2>
            <p className="text-xs text-muted-foreground">Submitted vs resolved over time</p>
          </div>
          <ComplaintTrendChart data={trend} />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Top categories</h2>
            <p className="text-xs text-muted-foreground">Share of complaints by category</p>
          </div>
          <CategoryPieChart data={categoryDist} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Status distribution</h2>
            <p className="text-xs text-muted-foreground">Where cases sit in the lifecycle</p>
          </div>
          <DistributionBarChart data={statusDist} dataKey="label" />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Priority distribution</h2>
            <p className="text-xs text-muted-foreground">Volume by priority level</p>
          </div>
          <DistributionBarChart data={priorityDist} dataKey="priority" fillColor="#C4892A" />
        </div>
      </div>
    </div>
  );
}
