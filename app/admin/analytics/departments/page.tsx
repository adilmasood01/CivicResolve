import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminAnalyticsNav } from "@/components/admin/AdminAnalyticsNav";
import { PageHeader } from "@/components/layout";
import { getDepartmentPerformance } from "@/services/analytics.service";
import { ArrowUpDown, FileText, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Department Comparison Analytics | CivicResolve Admin",
  description: "Cross-departmental complaint volume, resolution rate, and SLA performance metrics.",
};

export default async function DepartmentAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (!can(user, "analytics:view-system")) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          You don&apos;t have permission to view department analytics.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;
  const sortBy = (typeof params.sortBy === "string" ? params.sortBy : "totalComplaints") as string;

  const data = await getDepartmentPerformance(user, { range });

  // Sorting
  const sortedData = [...data].sort((a: any, b: any) => {
    return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Comparison"
        description="Compare total volume, resolution speed, and SLA compliance across municipal departments."
        actions={
          <a
            href="/api/reports/departments/pdf"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-700"
          >
            <FileText className="h-4 w-4" />
            <span>Export PDF Report</span>
          </a>
        }
      />

      <AdminAnalyticsNav />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Department Performance Metrics ({sortedData.length} Departments)
          </span>
          <span className="text-xs text-muted-foreground">Click columns to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">
                  <Link
                    href={`/admin/analytics/departments?sortBy=totalComplaints`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <span>Total Volume</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </th>
                <th className="px-4 py-3">Open</th>
                <th className="px-4 py-3">Resolved</th>
                <th className="px-4 py-3">
                  <Link
                    href={`/admin/analytics/departments?sortBy=resolutionRatePercent`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <span>Resolution Rate</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </th>
                <th className="px-4 py-3">
                  <Link
                    href={`/admin/analytics/departments?sortBy=slaCompliancePercent`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <span>SLA Compliance</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </th>
                <th className="px-4 py-3">
                  <Link
                    href={`/admin/analytics/departments?sortBy=slaBreaches`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <span>Breaches</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </th>
                <th className="px-4 py-3">Avg Res Time</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {sortedData.map((d) => (
                <tr key={d.departmentId} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div>{d.departmentName}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Code: {d.departmentCode}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">{d.totalComplaints}</td>
                  <td className="px-4 py-3.5 font-medium text-amber-600">{d.openComplaints}</td>
                  <td className="px-4 py-3.5 font-medium text-emerald-600">{d.resolvedComplaints}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {d.resolutionRatePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        d.slaCompliancePercent >= 90
                          ? "bg-emerald-50 text-emerald-700"
                          : d.slaCompliancePercent >= 75
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {d.slaCompliancePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-red-600">{d.slaBreaches}</td>
                  <td className="px-4 py-3.5 font-medium text-foreground">{d.avgResolutionHours} hrs</td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/analytics/departments/${d.departmentId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
