import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import AuthNav from "@/components/AuthNav";
import { getSLAAnalytics } from "@/services/analytics.service";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

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
      <div className="p-8 text-center text-red-600 font-bold">
        Forbidden: SLA Analytics access requires ADMIN role.
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;

  const data = await getSLAAnalytics(user, { range });

  return (
    <div className="dashboard-layout bg-gray-50 min-h-screen">
      <AuthNav user={user} />

      <main className="dashboard-main py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 bg-white p-6 rounded-2xl border-gray-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  SLA Compliance Analytics
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Monitor service-level agreement adherence, deadline warnings, and breach events.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {["7d", "30d", "90d", "6m", "12m"].map((r) => (
                <Link
                  key={r}
                  href={`/admin/analytics/sla?range=${r}`}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    range === r ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r.toUpperCase()}
                </Link>
              ))}
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Department Comparison
            </Link>
            <Link
              href="/admin/analytics/sla"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs"
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

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>SLA Compliance Rate</span>
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-indigo-600">{data.slaComplianceRate}%</p>
              <p className="text-xs text-gray-500 font-medium">Completed within target deadline</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Active Breaches</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-3xl font-black text-red-600">{data.activeBreached}</p>
              <p className="text-xs text-gray-500 font-medium">Urgent resolution required</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Approaching Deadline</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-600">{data.activeDueSoon}</p>
              <p className="text-xs text-gray-500 font-medium">Within warning threshold</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Completed Within SLA</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">{data.completedInSLA}</p>
              <p className="text-xs text-gray-500 font-medium">Completed after SLA: {data.completedAfterSLA}</p>
            </div>
          </div>

          {/* Business Definition Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">SLA Calculation Definitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-900">SLA Compliance Rate Formula:</span>
                <p className="mt-1 font-mono text-[11px] text-blue-700 bg-white p-2 rounded-lg border border-gray-200">
                  SLA Compliance % = (Complaints Completed Within SLA / Total Completed Complaints) × 100
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-900">Active Breach Detection:</span>
                <p className="mt-1 font-mono text-[11px] text-red-700 bg-white p-2 rounded-lg border border-gray-200">
                  Active Breach = (Status is Active) AND (Current Time &gt; SLA Deadline)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
