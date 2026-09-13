/**
 * CivicResolve — Officer Dashboard (Staff)
 *
 * Entry point for OFFICER role users.
 * Server component: verifies OFFICER (or higher) role server-side.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { prisma } from "@/lib/prisma";
import { getSLAInfo } from "@/lib/sla";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Dashboard | CivicResolve",
};

export default async function StaffDashboardPage() {
  const user = await requireRole("OFFICER", "DEPARTMENT_MANAGER", "ADMIN");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Department info if assigned
  let departmentName = "All Departments";
  if (user.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { name: true },
    });
    if (dept) departmentName = dept.name;
  }

  // Database stats queries
  const [assignedToMeCount, inProgressCount, resolvedTodayCount, recentAssigned, slaRules] =
    await Promise.all([
      prisma.complaint.count({
        where: { assignedOfficerId: user.id },
      }),
      prisma.complaint.count({
        where: { assignedOfficerId: user.id, status: "IN_PROGRESS" },
      }),
      prisma.complaint.count({
        where: {
          assignedOfficerId: user.id,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: { gte: startOfDay },
        },
      }),
      prisma.complaint.findMany({
        where: user.departmentId
          ? { OR: [{ assignedOfficerId: user.id }, { departmentId: user.departmentId }] }
          : { assignedOfficerId: user.id },
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

  const complaintsWithSLA = recentAssigned.map((c) => ({
    ...c,
    slaInfo: getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt),
  }));

  const slaWarningsCount = complaintsWithSLA.filter(
    (c) => c.slaInfo.status === "DUE_SOON" || c.slaInfo.status === "BREACHED"
  ).length;

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="dashboard-container max-w-6xl mx-auto space-y-8">
          {/* Welcome banner */}
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-welcome-title">Officer Dashboard</h1>
              <p className="dashboard-welcome-sub">
                Welcome, {user.name?.split(" ")[0] ?? "Officer"} — manage your assigned complaints & department tasks
              </p>
            </div>
            {user.departmentId && (
              <div className="dashboard-dept-badge">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>{departmentName}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="dashboard-stats-grid">
            {[
              { label: "Assigned to Me", value: assignedToMeCount, icon: ClipboardList, color: "stat-blue" },
              { label: "In Progress", value: inProgressCount, icon: Clock, color: "stat-amber" },
              { label: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle2, color: "stat-green" },
              { label: "SLA Alerts", value: slaWarningsCount, icon: AlertTriangle, color: "stat-red" },
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
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <div className="quick-links-grid">
              {[
                { href: "/staff/complaints", icon: ClipboardList, label: "My complaints inbox", desc: "View all complaints assigned to you" },
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

          {/* Recent Complaints Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Inbox Complaints</h2>
              <Link
                href="/staff/complaints"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Go to Inbox</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ComplaintTable
              complaints={complaintsWithSLA}
              getDetailHref={(id) => `/staff/complaints/${id}`}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
