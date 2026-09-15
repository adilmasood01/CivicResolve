/**
 * CivicResolve — Manager Dashboard
 *
 * Entry point for DEPARTMENT_MANAGER role users.
 * Server component: verifies DEPARTMENT_MANAGER (or ADMIN) role.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSLAInfo } from "@/lib/sla";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { StatStrip } from "@/components/layout/StatStrip";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { Building2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Manager Dashboard | CivicResolve",
};

export default async function ManagerDashboardPage() {
  const user = await requireRole("DEPARTMENT_MANAGER", "ADMIN");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const deptWhere = user.departmentId ? { departmentId: user.departmentId } : {};

  let departmentName = "All Departments";
  if (user.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { name: true },
    });
    if (dept) departmentName = dept.name;
  }

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
    <AppShell user={user}>
      <PageHeader
        title="Manager dashboard"
        description={`Welcome, ${user.name?.split(" ")[0] ?? "Manager"} — oversee ${departmentName}'s complaints and workload.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {departmentName}
          </span>
        }
      />

      <StatStrip
        className="mb-8"
        items={[
          { label: "Open complaints", value: openCount, tone: "warn" },
          {
            label: "Active officers",
            value: activeOfficersCount,
            hint: "Officer workload capacity",
          },
          { label: "Resolved this week", value: resolvedWeekCount, tone: "success" },
          {
            label: "SLA breaches",
            value: slaBreachesCount,
            tone: slaBreachesCount > 0 ? "danger" : "default",
            hint: "In recent list",
          },
        ]}
      />

      <Section
        title="Recent department complaints"
        actions={
          <Link
            href="/manager/complaints"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Manage complaints
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      >
        <ComplaintTable
          complaints={complaintsWithSLA}
          getDetailHref={(id) => `/manager/complaints/${id}`}
          showOfficer
          emptyTitle="No department complaints"
          emptyDescription="New complaints for this department will appear here."
        />
      </Section>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
        <Link href="/manager/complaints" className="text-primary hover:underline">
          Department complaints
        </Link>
        <Link
          href="/manager/analytics"
          className="text-muted-foreground hover:text-foreground"
        >
          Analytics
        </Link>
      </nav>
    </AppShell>
  );
}
