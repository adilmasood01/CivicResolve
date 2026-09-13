/**
 * CivicResolve — Citizen Dashboard
 *
 * Entry point for CITIZEN role users.
 * Server component: verifies auth and role server-side.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { prisma } from "@/lib/prisma";
import { getSLAInfo } from "@/lib/sla";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import {
  FileText,
  PlusCircle,
  Bell,
  User,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Dashboard | CivicResolve",
};

export default async function CitizenDashboardPage() {
  // Server-side: verify CITIZEN (or higher) role — redirects if not
  const user = await requireRole("CITIZEN", "OFFICER", "DEPARTMENT_MANAGER", "ADMIN");

  // Query live statistics from database
  const [totalCount, inProgressCount, resolvedCount, unreadNotifCount, recentComplaints, slaRules] =
    await Promise.all([
      prisma.complaint.count({ where: { citizenId: user.id } }),
      prisma.complaint.count({
        where: {
          citizenId: user.id,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        },
      }),
      prisma.complaint.count({
        where: {
          citizenId: user.id,
          status: { in: ["RESOLVED", "CLOSED"] },
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.complaint.findMany({
        where: { citizenId: user.id },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.sLARule.findMany({ where: { isActive: true } }),
    ]);

  const complaintsWithSLA = recentComplaints.map((c) => ({
    ...c,
    slaInfo: getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt),
  }));

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="dashboard-container max-w-6xl mx-auto space-y-8">
          {/* Welcome banner */}
          <div className="dashboard-welcome">
            <div>
              <h1 className="dashboard-welcome-title">
                Welcome back, {user.name?.split(" ")[0] ?? "Citizen"}
              </h1>
              <p className="dashboard-welcome-sub">
                Track and manage your submitted public service complaints
              </p>
            </div>
            <Link href="/complaints/new" className="dashboard-new-btn px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Submit New Complaint</span>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="dashboard-stats-grid">
            {[
              { label: "Total Complaints", value: totalCount, icon: FileText, color: "stat-blue" },
              { label: "Active / In Progress", value: inProgressCount, icon: Clock, color: "stat-amber" },
              { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "stat-green" },
              { label: "Unread Notifications", value: unreadNotifCount, icon: Bell, color: "stat-purple" },
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
                { href: "/complaints/new", icon: PlusCircle, label: "Submit a complaint", desc: "Report a new public service issue" },
                { href: "/complaints", icon: FileText, label: "My complaints", desc: "View and track your submissions" },
                { href: "/profile", icon: User, label: "My profile", desc: "Manage your account settings" },
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

          {/* Recent Complaints Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Complaints</h2>
              {totalCount > 0 && (
                <Link
                  href="/complaints"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  <span>View All ({totalCount})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {complaintsWithSLA.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 shadow-xs">
                <p className="text-sm font-semibold text-gray-700">No complaints submitted yet</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When you report public service issues, you will be able to track their real-time progress here.
                </p>
                <Link
                  href="/complaints/new"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Submit your first complaint</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complaintsWithSLA.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    detailHref={`/complaints/${c.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
