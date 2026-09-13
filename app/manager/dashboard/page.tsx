/**
 * CivicResolve — Manager Dashboard
 *
 * Entry point for DEPARTMENT_MANAGER role users.
 * Server component: verifies DEPARTMENT_MANAGER (or ADMIN) role.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { prisma } from "@/lib/prisma";
import { getSLAInfo } from "@/lib/sla";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import {
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manager Dashboard | CivicResolve",
};

export default async function ManagerDashboardPage() {
  const user = await requireRole("DEPARTMENT_MANAGER", "ADMIN");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const deptWhere = user.departmentId ? { departmentId: user.departmentId } : {};

  // Fetch department details
  let departmentName = "All Departments";
  if (user.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { name: true },
    });
    if (dept) departmentName = dept.name;
  }

  // Database stats queries
  const [openCount, activeOfficersCount, resolvedWeekCount, recentDeptComplaints, slaRules] =
    await Promise.all([
      prisma.complaint.count({
        where: {
          ...deptWhere,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        },
      }),
      prisma.user.count({
        where: {
          ...deptWhere,
          role: "OFFICER",
          isActive: true,
        },
      }),
      prisma.complaint.count({
        where: {
          ...deptWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.complaint.findMany({
        where: deptWhere,
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          assignedOfficer: { select: { name: true, email: true } },
        },
      }),
      prisma.sLARule.findMany({ where: { isActive: true } }),
    ]);

  const complaintsWithSLA = recentDeptComplaints.map((c) => ({
    ...c,
    slaInfo: getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt),
  }));

  const slaBreachesCount = complaintsWithSLA.filter(
    (c) => c.slaInfo.status === "BREACHED"
  ).length;

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="dashboard-container max-w-6xl mx-auto space-y-8">
          {/* Welcome banner */}
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-welcome-title">Manager Dashboard</h1>
              <p className="dashboard-welcome-sub">
                Welcome, {user.name?.split(" ")[0] ?? "Manager"} — oversee {departmentName}&apos;s complaints & workload
              </p>
            </div>
            <div className="dashboard-dept-badge">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>{departmentName}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="dashboard-stats-grid">
            {[
              { label: "Open Complaints", value: openCount, icon: ClipboardList, color: "stat-blue" },
              { label: "Active Officers", value: activeOfficersCount, icon: Users, color: "stat-purple" },
              { label: "Resolved This Week", value: resolvedWeekCount, icon: CheckCircle2, color: "stat-green" },
              { label: "SLA Breaches", value: slaBreachesCount, icon: AlertTriangle, color: "stat-red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`dashboard-stat-card ${color}`}>
                <div className="stat-icon-wrap">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="dashboard-quick-links">
            <h2 className="dashboard-section-title">Management Actions</h2>
            <div className="quick-links-grid">
              {[
                { href: "/manager/complaints", icon: ClipboardList, label: "Department complaints", desc: "View and assign officer workloads" },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href} className="quick-link-card">
                  <Icon className="quick-link-icon" aria-hidden="true" />
                  <div>
                    <p className="quick-link-title">{label}</p>
                    <p className="quick-link-desc">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Department Complaints Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Department Complaints</h2>
              <Link
                href="/manager/complaints"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Manage Complaints</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ComplaintTable
              complaints={complaintsWithSLA}
              getDetailHref={(id) => `/manager/complaints/${id}`}
              showOfficer
            />
          </div>
        </div>
      </main>
    </div>
  );
}
