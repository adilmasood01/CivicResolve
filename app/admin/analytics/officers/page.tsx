import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import AuthNav from "@/components/AuthNav";
import { getOfficerWorkload } from "@/services/analytics.service";
import { Users, ArrowUpDown, UserCheck, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Officer Workload Analytics | CivicResolve",
  description: "Operational workload, assignment count, and resolution performance across officers.",
};

export default async function OfficerWorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (!can(user, "analytics:view-system") && user.role !== "DEPARTMENT_MANAGER") {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Forbidden: Staff workload analytics requires ADMIN or DEPARTMENT_MANAGER role.
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;

  const data = await getOfficerWorkload(user, { range });

  return (
    <div className="dashboard-layout bg-gray-50 min-h-screen">
      <AuthNav user={user} />

      <main className="dashboard-main py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-6 bg-white p-6 rounded-2xl border-gray-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Officer Workload & Performance Analytics
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Operational visibility into assigned caseloads, open items, breaches, and resolution times.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {["7d", "30d", "90d", "6m", "12m"].map((r) => (
                <Link
                  key={r}
                  href={`/admin/analytics/officers?range=${r}`}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    range === r ? "bg-white text-emerald-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Analytics Sub Navigation Bar */}
          {user.role === "ADMIN" && (
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
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                SLA Compliance
              </Link>
              <Link
                href="/admin/analytics/officers"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs"
              >
                Officer Workload
              </Link>
            </div>
          )}

          {/* Officer Workload Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Officer Caseload Breakdown ({data.length} Officers)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Officer</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Complaints</th>
                    <th className="py-3 px-4">Open</th>
                    <th className="py-3 px-4">Resolved</th>
                    <th className="py-3 px-4">Breached</th>
                    <th className="py-3 px-4">Avg Resolution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {data.map((o) => (
                    <tr key={o.officerId} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div>{o.officerName}</div>
                        <div className="text-xs font-normal text-gray-400">{o.officerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{o.departmentName}</td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">{o.totalAssigned}</td>
                      <td className="py-3.5 px-4 font-medium text-amber-600">{o.openComplaints}</td>
                      <td className="py-3.5 px-4 font-medium text-emerald-600">{o.resolvedComplaints}</td>
                      <td className="py-3.5 px-4 font-bold text-red-600">{o.breachedComplaints}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{o.avgResolutionHours} hrs</td>
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
