/**
 * CivicResolve — Citizen Dashboard
 *
 * Entry point for CITIZEN role users.
 * Server component: verifies auth and role server-side.
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
import { EmptyState } from "@/components/layout/EmptyState";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { PlusCircle, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "My Dashboard | CivicResolve",
};

export default async function CitizenDashboardPage() {
  const user = await requireRole("CITIZEN", "OFFICER", "DEPARTMENT_MANAGER", "ADMIN");

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
    <AppShell user={user} unreadCount={unreadNotifCount}>
      <PageHeader
        title={`Welcome back, ${user.name?.split(" ")[0] ?? "Citizen"}`}
        description="Track and manage your submitted public service complaints."
        actions={
          <Link
            href="/complaints/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Submit complaint
          </Link>
        }
      />

      <StatStrip
        className="mb-8"
        items={[
          { label: "Total", value: totalCount },
          { label: "Open", value: inProgressCount, tone: "warn" },
          { label: "Resolved", value: resolvedCount, tone: "success" },
          {
            label: "Notifications",
            value: unreadNotifCount,
            tone: unreadNotifCount > 0 ? "info" : "default",
          },
        ]}
      />

      <Section
        title="Recent complaints"
        actions={
          totalCount > 0 ? (
            <Link
              href="/complaints"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all ({totalCount})
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null
        }
      >
        {complaintsWithSLA.length === 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              title="No complaints yet"
              description="When you report public service issues, you can track their progress here."
              icon={<FileText className="h-8 w-8" aria-hidden="true" />}
              action={
                <Link
                  href="/complaints/new"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Submit your first complaint
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <ComplaintTable
                complaints={complaintsWithSLA}
                getDetailHref={(id) => `/complaints/${id}`}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {complaintsWithSLA.map((c) => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  detailHref={`/complaints/${c.id}`}
                />
              ))}
            </div>
          </>
        )}
      </Section>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
        <Link href="/complaints/new" className="text-primary hover:underline">
          Submit a complaint
        </Link>
        <Link href="/complaints" className="text-muted-foreground hover:text-foreground">
          My complaints
        </Link>
        <Link href="/notifications" className="text-muted-foreground hover:text-foreground">
          Notifications
        </Link>
        <Link href="/profile" className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
      </nav>
    </AppShell>
  );
}
