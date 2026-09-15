import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { AdminAnalyticsNav } from "@/components/admin/AdminAnalyticsNav";
import { PageHeader } from "@/components/layout";
import { getDepartmentAnalytics } from "@/services/analytics.service";
import {
  ComplaintTrendChart,
  CategoryPieChart,
} from "@/components/analytics/AnalyticsCharts";
import { ArrowLeft, Layers, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Department Detail Analytics | CivicResolve",
  description: "Detailed operational performance metrics for a specific department.",
};

export default async function DepartmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const sParams = await searchParams;
  const range = (typeof sParams.range === "string" ? sParams.range : "30d") as any;

  try {
    const data = await getDepartmentAnalytics(user, id, { range });

    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <Link
              href="/admin/analytics/departments"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to departments
            </Link>
          }
          title={`${data.department.name} — Department Analytics`}
          description={`Department Code: ${data.department.code} | Scoped metrics & officer workload`}
        />

        <AdminAnalyticsNav />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Total Complaints</span>
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{data.kpis.totalComplaints}</p>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Resolution Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-semibold text-emerald-600">{data.kpis.resolutionRatePercent}%</p>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>SLA Compliance</span>
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-semibold text-indigo-600">{data.kpis.slaCompliancePercent}%</p>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Active Breaches</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-semibold text-amber-600">{data.kpis.slaBreaches}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-foreground">Department Complaint Trend</h2>
            <ComplaintTrendChart data={data.trend} />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">Category Volume</h2>
            <CategoryPieChart data={data.categoryDist} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Department Staff Workload & Performance ({data.officerWorkload.length} Officers)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Open</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3">Breached</th>
                  <th className="px-4 py-3">Avg Res Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {data.officerWorkload.map((o) => (
                  <tr key={o.officerId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{o.officerName}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{o.totalAssigned}</td>
                    <td className="px-4 py-3 font-medium text-amber-600">{o.openComplaints}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{o.resolvedComplaints}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{o.breachedComplaints}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{o.avgResolutionHours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
