import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import AuthNav from "@/components/AuthNav";
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
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  FileText,
  Users,
  Building2,
  Download,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

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
      <div className="p-8 text-center text-red-600 font-bold">
        Forbidden: You do not have administrative access to system-wide analytics.
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
    <div className="dashboard-layout bg-gray-50 min-h-screen">
      <AuthNav user={user} />

      <main className="dashboard-main py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 bg-white p-6 rounded-2xl border-gray-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Executive Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Real-time operational performance, resolution rates, and SLA compliance.
                </p>
              </div>
            </div>

            {/* Date Range Selector & Exports */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                {["7d", "30d", "90d", "6m", "12m"].map((r) => (
                  <Link
                    key={r}
                    href={`/admin/analytics?range=${r}`}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      range === r ? "bg-white text-blue-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {r.toUpperCase()}
                  </Link>
                ))}
              </div>

              <a
                href="/api/reports/complaints/csv"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </a>

              <a
                href="/api/reports/complaints/pdf"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-xs"
              >
                <FileText className="h-4 w-4" />
                <span>PDF Summary</span>
              </a>
            </div>
          </div>

          {/* Analytics Sub Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href="/admin/analytics"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs"
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

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Total Complaints</span>
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-3xl font-black text-gray-900">{kpis.totalComplaints}</p>
              <p className="text-xs text-gray-500 font-medium">In selected time range</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Resolution Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">{kpis.resolutionRatePercent}%</p>
              <p className="text-xs text-gray-500 font-medium">{kpis.resolvedComplaints} resolved / {kpis.openComplaints} open</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>SLA Compliance</span>
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-indigo-600">{kpis.slaCompliancePercent}%</p>
              <p className="text-xs text-gray-500 font-medium">Resolved within SLA deadline</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Active Breaches</span>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-600">{kpis.slaBreaches}</p>
              <p className="text-xs text-gray-500 font-medium">Unresolved past SLA limit</p>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">Complaint Volume Trend</h2>
                </div>
                <span className="text-xs font-medium text-gray-400">Submitted vs Resolved</span>
              </div>
              <ComplaintTrendChart data={trend} />
            </div>

            {/* Top Categories Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-gray-900">Top Categories</h2>
              </div>
              <CategoryPieChart data={categoryDist} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">Status Distribution</h2>
              <DistributionBarChart data={statusDist} dataKey="label" fillColor="#2563EB" />
            </div>

            {/* Priority Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">Priority Distribution</h2>
              <DistributionBarChart data={priorityDist} dataKey="priority" fillColor="#D97706" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
