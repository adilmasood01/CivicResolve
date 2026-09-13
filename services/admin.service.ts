import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import { Role } from "@prisma/client";

/**
 * Aggregates system-wide administrative statistics for the Admin Dashboard.
 * Uses server-side database grouping and counting to avoid N+1 queries.
 */
export async function getAdminDashboardStats(currentUser: SessionUser) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalCitizens,
    totalOfficers,
    totalManagers,
    totalDepartments,
    totalCategories,
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    breachedSLAs,
    unassignedComplaints,
    submittedToday,
    resolvedToday,
    unresolvedCritical,
    departments,
  ] = await Promise.all([
    // System Overview Counts
    prisma.user.count({ where: { role: Role.CITIZEN } }),
    prisma.user.count({ where: { role: Role.OFFICER } }),
    prisma.user.count({ where: { role: Role.DEPARTMENT_MANAGER } }),
    prisma.department.count(),
    prisma.category.count(),
    prisma.complaint.count(),
    prisma.complaint.count({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
      },
    }),
    prisma.complaint.count({
      where: { status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.complaint.count({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        slaDeadline: { lt: new Date() },
      },
    }),
    prisma.complaint.count({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        assignedOfficerId: null,
      },
    }),
    // System Health Counts
    prisma.complaint.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.complaint.count({
      where: {
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: todayStart },
      },
    }),
    prisma.complaint.count({
      where: {
        priority: "CRITICAL",
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
      },
    }),
    // Department Summaries
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            staff: true,
            complaints: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Compute breakdown for each department
  const departmentSummaries = await Promise.all(
    departments.map(async (d) => {
      const [deptOpen, deptResolved, deptBreached] = await Promise.all([
        prisma.complaint.count({
          where: {
            departmentId: d.id,
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
          },
        }),
        prisma.complaint.count({
          where: {
            departmentId: d.id,
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        }),
        prisma.complaint.count({
          where: {
            departmentId: d.id,
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
            slaDeadline: { lt: new Date() },
          },
        }),
      ]);

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        managerName: d.manager?.name ?? d.manager?.email ?? "Unassigned",
        officersCount: d._count.staff,
        totalComplaints: d._count.complaints,
        openComplaints: deptOpen,
        resolvedComplaints: deptResolved,
        slaBreaches: deptBreached,
      };
    })
  );

  return {
    overview: {
      totalCitizens,
      totalOfficers,
      totalManagers,
      totalDepartments,
      totalCategories,
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      breachedSLAs,
      unassignedComplaints,
    },
    systemHealth: {
      submittedToday,
      resolvedToday,
      currentlyBreached: breachedSLAs,
      unresolvedCritical,
      unassignedComplaints,
    },
    departmentSummaries,
  };
}

/**
 * Retrieves staff overview for staff management dashboard.
 */
export async function getStaffOverview(
  currentUser: SessionUser,
  filters?: { departmentId?: string; search?: string }
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const where: any = {
    role: { in: [Role.OFFICER, Role.DEPARTMENT_MANAGER] },
  };

  if (filters?.departmentId) {
    where.departmentId = filters.departmentId;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedComplaints: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return staff.map((s) => {
    const totalAssigned = s.assignedComplaints.length;
    const openAssigned = s.assignedComplaints.filter((c) =>
      ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status)
    ).length;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      isActive: s.isActive,
      department: s.department,
      createdAt: s.createdAt,
      assignedComplaintCount: totalAssigned,
      openComplaintCount: openAssigned,
    };
  });
}
