import { prisma } from "@/lib/prisma";
import { getSLAInfo } from "@/lib/sla";
import { can } from "@/lib/permissions";
import type { SessionUser } from "@/types";
import { ComplaintStatus, Priority, Prisma, Role } from "@prisma/client";
import { subDays, subMonths, startOfDay, endOfDay, format } from "date-fns";

export interface DateRangeOptions {
  range?: "7d" | "30d" | "90d" | "6m" | "12m" | "custom";
  dateFrom?: string;
  dateTo?: string;
}

export function getDateBounds(options?: DateRangeOptions) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = endOfDay(now);

  if (options?.range === "7d") {
    startDate = startOfDay(subDays(now, 7));
  } else if (options?.range === "30d") {
    startDate = startOfDay(subDays(now, 30));
  } else if (options?.range === "90d") {
    startDate = startOfDay(subDays(now, 90));
  } else if (options?.range === "6m") {
    startDate = startOfDay(subMonths(now, 6));
  } else if (options?.range === "12m") {
    startDate = startOfDay(subMonths(now, 12));
  } else if (options?.range === "custom" && options.dateFrom && options.dateTo) {
    startDate = startOfDay(new Date(options.dateFrom));
    endDate = endOfDay(new Date(options.dateTo));
  } else {
    // Default 30 days
    startDate = startOfDay(subDays(now, 30));
  }

  if (startDate > endDate) {
    // Fallback if invalid
    startDate = startOfDay(subDays(now, 30));
  }

  return { startDate, endDate };
}

/**
 * Builds base authorization scope query for complaints table based on session user.
 */
export function getBaseAuthorizationWhere(user: SessionUser, overrideDepartmentId?: string): Prisma.ComplaintWhereInput {
  const where: Prisma.ComplaintWhereInput = {};

  switch (user.role) {
    case "CITIZEN":
      where.citizenId = user.id;
      break;

    case "OFFICER":
      if (user.departmentId) {
        where.OR = [
          { assignedOfficerId: user.id },
          { departmentId: user.departmentId },
        ];
      } else {
        where.assignedOfficerId = user.id;
      }
      break;

    case "DEPARTMENT_MANAGER":
      // Strictly scoped to manager's department
      where.departmentId = user.departmentId || "NO_DEPT_ASSIGNED";
      break;

    case "ADMIN":
      if (overrideDepartmentId) {
        where.departmentId = overrideDepartmentId;
      }
      break;
  }

  return where;
}

// ─────────────────────────────────────────────────────────────
// 1. SYSTEM EXECUTIVE KPIS
// ─────────────────────────────────────────────────────────────
export async function getSystemKPIs(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  // Check RBAC permission
  const isPermitted = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    user.role === "ADMIN" ? "analytics:view-system" : "analytics:view-department"
  );
  if (!isPermitted) {
    throw new Error("Forbidden: You do not have permission to view analytics.");
  }

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);

  const where: Prisma.ComplaintWhereInput = {
    ...baseWhere,
    createdAt: { gte: startDate, lte: endDate },
  };

  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  const complaints = await prisma.complaint.findMany({
    where,
    select: {
      id: true,
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      closedAt: true,
      slaDeadline: true,
    },
  });

  const totalComplaints = complaints.length;
  let openComplaints = 0;
  let resolvedComplaints = 0;
  let completedInSLA = 0;
  let completedAfterSLA = 0;
  let slaBreaches = 0;

  let totalResolutionTimeMs = 0;
  let resolutionTimeCount = 0;

  for (const c of complaints) {
    const isCompleted =
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.REJECTED;

    if (isCompleted) {
      resolvedComplaints++;
      const endTimestamp = c.resolvedAt || c.closedAt;
      if (endTimestamp) {
        totalResolutionTimeMs += endTimestamp.getTime() - c.createdAt.getTime();
        resolutionTimeCount++;
      }

      if (c.slaDeadline && endTimestamp && endTimestamp.getTime() <= c.slaDeadline.getTime()) {
        completedInSLA++;
      } else if (c.slaDeadline) {
        completedAfterSLA++;
      }
    } else {
      openComplaints++;
      const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
      if (slaInfo.status === "BREACHED") {
        slaBreaches++;
      }
    }
  }

  const resolutionRatePercent =
    totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

  const totalCompletedWithSLA = completedInSLA + completedAfterSLA;
  const slaCompliancePercent =
    totalCompletedWithSLA > 0 ? Math.round((completedInSLA / totalCompletedWithSLA) * 100) : 100;

  const avgResolutionHours =
    resolutionTimeCount > 0
      ? Number((totalResolutionTimeMs / (resolutionTimeCount * 1000 * 3600)).toFixed(1))
      : 0;

  return {
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    resolutionRatePercent,
    slaCompliancePercent,
    slaBreaches,
    avgResolutionHours,
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
  };
}

// ─────────────────────────────────────────────────────────────
// 2. COMPLAINT TREND ANALYTICS (SUBMITTED VS RESOLVED)
// ─────────────────────────────────────────────────────────────
export async function getComplaintTrends(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);

  const complaints = await prisma.complaint.findMany({
    where: {
      ...baseWhere,
      OR: [
        { createdAt: { gte: startDate, lte: endDate } },
        { resolvedAt: { gte: startDate, lte: endDate } },
        { closedAt: { gte: startDate, lte: endDate } },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      resolvedAt: true,
      closedAt: true,
      status: true,
    },
  });

  // Group by day string 'YYYY-MM-DD'
  const trendMap: Record<string, { date: string; submitted: number; resolved: number }> = {};

  // Pre-fill all dates in range for continuous timeline
  let curr = new Date(startDate);
  while (curr <= endDate) {
    const key = format(curr, "yyyy-MM-dd");
    trendMap[key] = { date: key, submitted: 0, resolved: 0 };
    curr.setDate(curr.getDate() + 1);
  }

  for (const c of complaints) {
    if (c.createdAt >= startDate && c.createdAt <= endDate) {
      const createdKey = format(c.createdAt, "yyyy-MM-dd");
      if (trendMap[createdKey]) {
        trendMap[createdKey].submitted += 1;
      }
    }

    const resolutionDate = c.resolvedAt || c.closedAt;
    if (resolutionDate && resolutionDate >= startDate && resolutionDate <= endDate) {
      const resolvedKey = format(resolutionDate, "yyyy-MM-dd");
      if (trendMap[resolvedKey]) {
        trendMap[resolvedKey].resolved += 1;
      }
    }
  }

  return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
}

// ─────────────────────────────────────────────────────────────
// 3. STATUS DISTRIBUTION
// ─────────────────────────────────────────────────────────────
export async function getStatusDistribution(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);

  const counts = await prisma.complaint.groupBy({
    by: ["status"],
    where: {
      ...baseWhere,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  Object.values(ComplaintStatus).forEach((st) => (countMap[st] = 0));
  counts.forEach((c) => {
    countMap[c.status] = c._count.id;
  });

  const total = Object.values(countMap).reduce((acc, curr) => acc + curr, 0);

  return Object.entries(countMap).map(([status, count]) => ({
    status,
    label: status.replace("_", " "),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

// ─────────────────────────────────────────────────────────────
// 4. PRIORITY DISTRIBUTION
// ─────────────────────────────────────────────────────────────
export async function getPriorityDistribution(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);

  const counts = await prisma.complaint.groupBy({
    by: ["priority"],
    where: {
      ...baseWhere,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  Object.values(Priority).forEach((p) => (countMap[p] = 0));
  counts.forEach((c) => {
    countMap[c.priority] = c._count.id;
  });

  const total = Object.values(countMap).reduce((acc, curr) => acc + curr, 0);

  return Object.entries(countMap).map(([priority, count]) => ({
    priority,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

// ─────────────────────────────────────────────────────────────
// 5. CATEGORY DISTRIBUTION
// ─────────────────────────────────────────────────────────────
export async function getCategoryDistribution(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);

  const counts = await prisma.complaint.groupBy({
    by: ["categoryId"],
    where: {
      ...baseWhere,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const categoryIds = counts.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const catNameMap = new Map(categories.map((cat) => [cat.id, cat.name]));

  const total = counts.reduce((acc, curr) => acc + curr._count.id, 0);

  return counts.map((c) => {
    const name = catNameMap.get(c.categoryId) || "Unknown Category";
    return {
      categoryId: c.categoryId,
      name,
      count: c._count.id,
      percentage: total > 0 ? Math.round((c._count.id / total) * 100) : 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// 6. DEPARTMENT PERFORMANCE TABLE (ADMIN COMPARISON TABLE)
// ─────────────────────────────────────────────────────────────
export async function getDepartmentPerformance(user: SessionUser, dateRangeOptions?: DateRangeOptions) {
  if (!user || !user.id) throw new Error("Authentication required");
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: System-wide department comparison is restricted to ADMIN.");
  }

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  const performanceList = [];

  for (const dept of departments) {
    const complaints = await prisma.complaint.findMany({
      where: {
        departmentId: dept.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        closedAt: true,
        slaDeadline: true,
      },
    });

    const totalComplaints = complaints.length;
    let openCount = 0;
    let resolvedCount = 0;
    let completedInSLA = 0;
    let completedAfterSLA = 0;
    let slaBreaches = 0;
    let totalResTimeMs = 0;
    let resCount = 0;

    for (const c of complaints) {
      const isCompleted =
        c.status === ComplaintStatus.RESOLVED ||
        c.status === ComplaintStatus.CLOSED ||
        c.status === ComplaintStatus.REJECTED;

      if (isCompleted) {
        resolvedCount++;
        const endTimestamp = c.resolvedAt || c.closedAt;
        if (endTimestamp) {
          totalResTimeMs += endTimestamp.getTime() - c.createdAt.getTime();
          resCount++;
        }

        if (c.slaDeadline && endTimestamp && endTimestamp.getTime() <= c.slaDeadline.getTime()) {
          completedInSLA++;
        } else if (c.slaDeadline) {
          completedAfterSLA++;
        }
      } else {
        openCount++;
        const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
        if (slaInfo.status === "BREACHED") slaBreaches++;
      }
    }

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;
    const totalWithSLA = completedInSLA + completedAfterSLA;
    const slaCompliance =
      totalWithSLA > 0 ? Math.round((completedInSLA / totalWithSLA) * 100) : 100;
    const avgResolutionHours =
      resCount > 0 ? Number((totalResTimeMs / (resCount * 3600 * 1000)).toFixed(1)) : 0;

    performanceList.push({
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      totalComplaints,
      openComplaints: openCount,
      resolvedComplaints: resolvedCount,
      resolutionRatePercent: resolutionRate,
      slaCompliancePercent: slaCompliance,
      slaBreaches,
      avgResolutionHours,
    });
  }

  return performanceList;
}

// ─────────────────────────────────────────────────────────────
// 7. DEPARTMENT DETAIL ANALYTICS
// ─────────────────────────────────────────────────────────────
export async function getDepartmentAnalytics(user: SessionUser, targetDepartmentId: string, dateRangeOptions?: DateRangeOptions) {
  if (!user || !user.id) throw new Error("Authentication required");

  // Manager can ONLY view their own department. Admin can view any department.
  if (user.role === "DEPARTMENT_MANAGER" && user.departmentId !== targetDepartmentId) {
    throw new Error("Forbidden: You are not authorized to view another department's analytics.");
  }
  if (user.role === "CITIZEN" || user.role === "OFFICER") {
    throw new Error("Forbidden: Department analytics access denied.");
  }

  const department = await prisma.department.findUnique({
    where: { id: targetDepartmentId },
    select: { id: true, name: true, code: true, description: true },
  });

  if (!department) throw new Error("Department not found");

  const kpis = await getSystemKPIs(user, dateRangeOptions, targetDepartmentId);
  const trend = await getComplaintTrends(user, dateRangeOptions, targetDepartmentId);
  const statusDist = await getStatusDistribution(user, dateRangeOptions, targetDepartmentId);
  const priorityDist = await getPriorityDistribution(user, dateRangeOptions, targetDepartmentId);
  const categoryDist = await getCategoryDistribution(user, dateRangeOptions, targetDepartmentId);
  const officerWorkload = await getOfficerWorkload(user, dateRangeOptions, targetDepartmentId);

  return {
    department,
    kpis,
    trend,
    statusDist,
    priorityDist,
    categoryDist,
    officerWorkload,
  };
}

// ─────────────────────────────────────────────────────────────
// 8. SLA ANALYTICS & TRENDS
// ─────────────────────────────────────────────────────────────
export async function getSLAAnalytics(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const baseWhere = getBaseAuthorizationWhere(user, overrideDepartmentId);
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  const complaints = await prisma.complaint.findMany({
    where: {
      ...baseWhere,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      closedAt: true,
      slaDeadline: true,
    },
  });

  let completedInSLA = 0;
  let completedAfterSLA = 0;
  let activeBreached = 0;
  let activeDueSoon = 0;
  let activeOnTrack = 0;

  for (const c of complaints) {
    const isCompleted =
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.REJECTED;

    if (isCompleted) {
      const endTimestamp = c.resolvedAt || c.closedAt;
      if (c.slaDeadline && endTimestamp && endTimestamp.getTime() <= c.slaDeadline.getTime()) {
        completedInSLA++;
      } else {
        completedAfterSLA++;
      }
    } else {
      const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
      if (slaInfo.status === "BREACHED") activeBreached++;
      else if (slaInfo.status === "DUE_SOON") activeDueSoon++;
      else activeOnTrack++;
    }
  }

  const totalCompleted = completedInSLA + completedAfterSLA;
  const slaComplianceRate =
    totalCompleted > 0 ? Math.round((completedInSLA / totalCompleted) * 100) : 100;

  return {
    totalComplaints: complaints.length,
    completedInSLA,
    completedAfterSLA,
    activeBreached,
    activeDueSoon,
    activeOnTrack,
    slaComplianceRate,
  };
}

// ─────────────────────────────────────────────────────────────
// 9. OFFICER WORKLOAD & PERFORMANCE ANALYTICS
// ─────────────────────────────────────────────────────────────
export async function getOfficerWorkload(user: SessionUser, dateRangeOptions?: DateRangeOptions, overrideDepartmentId?: string) {
  if (!user || !user.id) throw new Error("Authentication required");

  if (user.role === "CITIZEN" || user.role === "OFFICER") {
    throw new Error("Forbidden: Staff performance analytics are restricted to ADMIN and DEPARTMENT_MANAGER.");
  }

  const targetDept = user.role === "DEPARTMENT_MANAGER" ? user.departmentId! : overrideDepartmentId;

  const staffWhere: Prisma.UserWhereInput = {
    role: { in: [Role.OFFICER, Role.DEPARTMENT_MANAGER] },
  };
  if (targetDept) {
    staffWhere.departmentId = targetDept;
  }

  const officers = await prisma.user.findMany({
    where: staffWhere,
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const { startDate, endDate } = getDateBounds(dateRangeOptions);
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  const result = [];

  for (const officer of officers) {
    const complaints = await prisma.complaint.findMany({
      where: {
        assignedOfficerId: officer.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        closedAt: true,
        slaDeadline: true,
      },
    });

    const totalAssigned = complaints.length;
    let openCount = 0;
    let resolvedCount = 0;
    let breachedCount = 0;
    let totalResTimeMs = 0;
    let resCount = 0;

    for (const c of complaints) {
      const isCompleted =
        c.status === ComplaintStatus.RESOLVED ||
        c.status === ComplaintStatus.CLOSED ||
        c.status === ComplaintStatus.REJECTED;

      if (isCompleted) {
        resolvedCount++;
        const endTimestamp = c.resolvedAt || c.closedAt;
        if (endTimestamp) {
          totalResTimeMs += endTimestamp.getTime() - c.createdAt.getTime();
          resCount++;
        }
      } else {
        openCount++;
        const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
        if (slaInfo.status === "BREACHED") breachedCount++;
      }
    }

    const avgResolutionHours =
      resCount > 0 ? Number((totalResTimeMs / (resCount * 3600 * 1000)).toFixed(1)) : 0;

    result.push({
      officerId: officer.id,
      officerName: officer.name || officer.email,
      officerEmail: officer.email,
      departmentName: officer.department?.name || "Unassigned",
      totalAssigned,
      openComplaints: openCount,
      resolvedComplaints: resolvedCount,
      breachedComplaints: breachedCount,
      avgResolutionHours,
    });
  }

  // Sort by total assigned complaints descending
  return result.sort((a, b) => b.totalAssigned - a.totalAssigned);
}
