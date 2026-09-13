import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import AuthNav from "@/components/AuthNav";
import { getDepartmentAnalytics } from "@/services/analytics.service";
import {
  ComplaintTrendChart,
  DistributionBarChart,
  CategoryPieChart,
} from "@/components/analytics/AnalyticsCharts";
import { Building2, ArrowLeft, Layers, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";

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
      <div className="dashboard-layout bg-gray-50 min-h-screen">
        <AuthNav user={user} />

        <main className="dashboard-main py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 bg-white p-6 rounded-2xl border-gray-200 shadow-xs">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/analytics/departments"
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {data.department.name} — Department Analytics
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Department Code: {data.department.code} | Scoped metrics & officer workload
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Total Complaints</span>
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-3xl font-black text-gray-900">{data.kpis.totalComplaints}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Resolution Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-black text-emerald-600">{data.kpis.resolutionRatePercent}%</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>SLA Compliance</span>
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-3xl font-black text-indigo-600">{data.kpis.slaCompliancePercent}%</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Active Breaches</span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-3xl font-black text-amber-600">{data.kpis.slaBreaches}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-gray-900">Department Complaint Trend</h2>
                <ComplaintTrendChart data={data.trend} />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-gray-900">Category Volume</h2>
                <CategoryPieChart data={data.categoryDist} />
              </div>
            </div>

            {/* Staff Workload Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Department Staff Workload & Performance ({data.officerWorkload.length} Officers)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Officer</th>
                      <th className="py-3 px-4">Assigned</th>
                      <th className="py-3 px-4">Open</th>
                      <th className="py-3 px-4">Resolved</th>
                      <th className="py-3 px-4">Breached</th>
                      <th className="py-3 px-4">Avg Res Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {data.officerWorkload.map((o) => (
                      <tr key={o.officerId} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{o.officerName}</td>
                        <td className="py-3 px-4 font-extrabold text-gray-900">{o.totalAssigned}</td>
                        <td className="py-3 px-4 text-amber-600 font-medium">{o.openComplaints}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">{o.resolvedComplaints}</td>
                        <td className="py-3 px-4 text-red-600 font-bold">{o.breachedComplaints}</td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{o.avgResolutionHours} hrs</td>
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
  } catch {
    notFound();
  }
}
