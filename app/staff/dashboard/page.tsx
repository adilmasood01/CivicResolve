/**
 * CivicResolve — Officer Dashboard (Staff)
 *
 * Entry point for OFFICER role users.
 * Server component: verifies OFFICER (or higher) role server-side.
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
  title: "Staff Dashboard | CivicResolve",
};

export default async function StaffDashboardPage() {
  const user = await requireRole("OFFICER", "DEPARTMENT_MANAGER", "ADMIN");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let departmentName = "All Departments";
  if (user.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { name: true },
    });
    if (dept) departmentName = dept.name;
  }

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

  const dueSoonCount = complaintsWithSLA.filter((c) => c.slaInfo.status === "DUE_SOON").length;
  const breachedCount = complaintsWithSLA.filter((c) => c.slaInfo.status === "BREACHED").length;
  const attentionCases = complaintsWithSLA.filter(
    (c) => c.slaInfo.status === "DUE_SOON" || c.slaInfo.status === "BREACHED"
  );

  const openCount = assignedToMeCount;

  return (
    <AppShell user={user}>
      <PageHeader
        title="Officer dashboard"
        description={`Welcome, ${user.name?.split(" ")[0] ?? "Officer"} — manage assigned complaints and department tasks.`}
        actions={
          user.departmentId ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              {departmentName}
            </span>
          ) : null
        }
      />

      <StatStrip
        className="mb-8"
        items={[
          {
            label: "Open / assigned",
            value: openCount,
            hint: resolvedTodayCount > 0 ? `${resolvedTodayCount} resolved today` : undefined,
          },
          { label: "In progress", value: inProgressCount, tone: "info" },
          {
            label: "Due soon",
            value: dueSoonCount,
            tone: dueSoonCount > 0 ? "warn" : "default",
            hint: "In recent inbox",
          },
          {
            label: "Breached",
            value: breachedCount,
            tone: breachedCount > 0 ? "danger" : "default",
            hint: "In recent inbox",
          },
        ]}
      />

      {attentionCases.length > 0 && (
        <Section
          title="Cases requiring attention"
          description="Recent inbox items with due-soon or breached SLA."
        >
          <ComplaintTable
            complaints={attentionCases}
            getDetailHref={(id) => `/staff/complaints/${id}`}
          />
        </Section>
      )}

      <Section
        title="Recent inbox"
        actions={
          <Link
            href="/staff/complaints"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Go to inbox
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      >
        <ComplaintTable
          complaints={complaintsWithSLA}
          getDetailHref={(id) => `/staff/complaints/${id}`}
          emptyTitle="No complaints in your inbox"
          emptyDescription="Assigned and department cases will appear here."
        />
      </Section>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
        <Link href="/staff/complaints" className="text-primary hover:underline">
          My complaints inbox
        </Link>
      </nav>
    </AppShell>
  );
}
