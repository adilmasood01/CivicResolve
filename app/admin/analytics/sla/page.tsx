import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminAnalyticsNav } from "@/components/admin/AdminAnalyticsNav";
import { PageHeader } from "@/components/layout";
import { getSLAAnalytics } from "@/services/analytics.service";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "SLA Analytics | CivicResolve Admin",
  description: "Detailed SLA compliance rates, breached complaints, due-soon tracking, and SLA statistics.",
};

export default async function SLAAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (!can(user, "analytics:view-system")) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          You don&apos;t have permission to view SLA analytics.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;

  const data = await getSLAAnalytics(user, { range });

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Compliance"
        description="Monitor service-level agreement adherence, deadline warnings, and breach events."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 text-xs font-medium">
            {["7d", "30d", "90d", "6m", "12m"].map((r) => (
              <Link
                key={r}
                href={`/admin/analytics/sla?range=${r}`}
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
        }
      />

      <AdminAnalyticsNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>SLA Compliance Rate</span>
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-semibold text-indigo-600">{data.slaComplianceRate}%</p>
          <p className="text-xs text-muted-foreground">Completed within target deadline</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Active Breaches</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-semibold text-red-600">{data.activeBreached}</p>
          <p className="text-xs text-muted-foreground">Urgent resolution required</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Approaching Deadline</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-semibold text-amber-600">{data.activeDueSoon}</p>
          <p className="text-xs text-muted-foreground">Within warning threshold</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Completed Within SLA</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-semibold text-emerald-600">{data.completedInSLA}</p>
          <p className="text-xs text-muted-foreground">
            Completed after SLA: {data.completedAfterSLA}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          SLA Calculation Definitions
        </h2>
        <div className="grid grid-cols-1 gap-4 text-xs text-muted-foreground md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <span className="font-semibold text-foreground">SLA Compliance Rate Formula:</span>
            <p className="mt-1 rounded-md border border-border bg-card p-2 font-mono text-[11px] text-blue-700">
              SLA Compliance % = (Complaints Completed Within SLA / Total Completed Complaints) × 100
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <span className="font-semibold text-foreground">Active Breach Detection:</span>
            <p className="mt-1 rounded-md border border-border bg-card p-2 font-mono text-[11px] text-red-700">
              Active Breach = (Status is Active) AND (Current Time &gt; SLA Deadline)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
