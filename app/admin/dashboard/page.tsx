import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardStats } from "@/services/admin.service";
import {
  Users,
  Building2,
  ClipboardList,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileQuestion,
} from "lucide-react";

export const metadata: Metadata = {
  title: "System Administration Dashboard",
};

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const stats = await getAdminDashboardStats(user);

  const { overview, systemHealth, departmentSummaries } = stats;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Control Center
            </h1>
          </div>
          <p className="text-sm text-slate-300">
            Welcome back, <span className="font-semibold text-white">{user.name ?? user.email}</span> — full administrative control & live metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
          >
            <Clock className="h-4 w-4 text-blue-400" />
            <span>Audit Trail</span>
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-900/20"
          >
            <Users className="h-4 w-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* System Health Alert Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Submitted Today</p>
            <p className="text-lg font-bold text-gray-900">{systemHealth.submittedToday}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Resolved Today</p>
            <p className="text-lg font-bold text-gray-900">{systemHealth.resolvedToday}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className={`p-2 rounded-lg ${systemHealth.currentlyBreached > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Active Breached SLAs</p>
            <p className={`text-lg font-bold ${systemHealth.currentlyBreached > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {systemHealth.currentlyBreached}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className={`p-2 rounded-lg ${systemHealth.unresolvedCritical > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500'}`}>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Critical Unresolved</p>
            <p className={`text-lg font-bold ${systemHealth.unresolvedCritical > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {systemHealth.unresolvedCritical}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className={`p-2 rounded-lg ${systemHealth.unassignedComplaints > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
            <FileQuestion className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Unassigned Complaints</p>
            <p className={`text-lg font-bold ${systemHealth.unassignedComplaints > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {systemHealth.unassignedComplaints}
            </p>
          </div>
        </div>
      </div>

      {/* System Overview Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>System Overview</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Citizens", val: overview.totalCitizens, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Officers", val: overview.totalOfficers, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Dept Managers", val: overview.totalManagers, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Departments", val: overview.totalDepartments, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Categories", val: overview.totalCategories, icon: FolderOpen, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Total Complaints", val: overview.totalComplaints, icon: ClipboardList, color: "text-slate-700", bg: "bg-slate-100" },
            { label: "Open Complaints", val: overview.openComplaints, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Resolved", val: overview.resolvedComplaints, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "SLA Breaches", val: overview.breachedSLAs, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Unassigned", val: overview.unassignedComplaints, icon: FileQuestion, color: "text-orange-600", bg: "bg-orange-50" },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Department Performance Summary</h2>
            <p className="text-xs text-gray-500">Live breakdown of complaints, staffing, and SLA performance across all departments</p>
          </div>
          <Link
            href="/admin/departments"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Manage Departments</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Manager</th>
                <th className="px-5 py-3.5 text-center">Officers</th>
                <th className="px-5 py-3.5 text-center">Total</th>
                <th className="px-5 py-3.5 text-center">Open</th>
                <th className="px-5 py-3.5 text-center">Resolved</th>
                <th className="px-5 py-3.5 text-center">SLA Breaches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {departmentSummaries.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-4 font-bold text-gray-900">{dept.name}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] text-slate-700">
                      {dept.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-800">{dept.managerName}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      {dept.officersCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-gray-900">{dept.totalComplaints}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-amber-700 font-semibold">{dept.openComplaints}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-emerald-700 font-semibold">{dept.resolvedComplaints}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {dept.slaBreaches > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3" />
                        {dept.slaBreaches}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">0</span>
                    )}
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
