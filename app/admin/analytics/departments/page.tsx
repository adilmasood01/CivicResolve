import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import AuthNav from "@/components/AuthNav";
import { getDepartmentPerformance } from "@/services/analytics.service";
import { Building2, ArrowUpDown, FileText, ChevronRight } from "lucide-react";

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
      <div className="p-8 text-center text-red-600 font-bold">
        Forbidden: System-wide department comparison requires ADMIN role.
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
    <div className="dashboard-layout bg-gray-50 min-h-screen">
      <AuthNav user={user} />

      <main className="dashboard-main py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 bg-white p-6 rounded-2xl border-gray-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Department Comparison Analytics
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Compare total volume, resolution speed, and SLA compliance across municipal departments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/reports/departments/pdf"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-xs"
              >
                <FileText className="h-4 w-4" />
                <span>Export PDF Report</span>
              </a>
            </div>
          </div>

          {/* Analytics Sub Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href="/admin/analytics"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              System Overview
            </Link>
            <Link
              href="/admin/analytics/departments"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Department Comparison
            </Link>
            <Link
              href="/admin/analytics/sla"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              SLA Compliance
            </Link>
            <Link
              href="/admin/analytics/officers"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Officer Workload
            </Link>
          </div>

          {/* Department Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Department Performance Metrics ({sortedData.length} Departments)
              </span>
              <span className="text-xs text-gray-500 font-medium">Click columns to sort</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">
                      <Link href={`/admin/analytics/departments?sortBy=totalComplaints`} className="inline-flex items-center gap-1 hover:text-blue-600">
                        <span>Total Volume</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="py-3 px-4">Open</th>
                    <th className="py-3 px-4">Resolved</th>
                    <th className="py-3 px-4">
                      <Link href={`/admin/analytics/departments?sortBy=resolutionRatePercent`} className="inline-flex items-center gap-1 hover:text-blue-600">
                        <span>Resolution Rate</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="py-3 px-4">
                      <Link href={`/admin/analytics/departments?sortBy=slaCompliancePercent`} className="inline-flex items-center gap-1 hover:text-blue-600">
                        <span>SLA Compliance</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="py-3 px-4">
                      <Link href={`/admin/analytics/departments?sortBy=slaBreaches`} className="inline-flex items-center gap-1 hover:text-blue-600">
                        <span>Breaches</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="py-3 px-4">Avg Res Time</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {sortedData.map((d) => (
                    <tr key={d.departmentId} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div>{d.departmentName}</div>
                        <div className="text-xs font-normal text-gray-400">Code: {d.departmentCode}</div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">{d.totalComplaints}</td>
                      <td className="py-3.5 px-4 font-medium text-amber-600">{d.openComplaints}</td>
                      <td className="py-3.5 px-4 font-medium text-emerald-600">{d.resolvedComplaints}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                          {d.resolutionRatePercent}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
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
                      <td className="py-3.5 px-4 font-bold text-red-600">{d.slaBreaches}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{d.avgResolutionHours} hrs</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/analytics/departments/${d.departmentId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
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
      </main>
    </div>
  );
}
