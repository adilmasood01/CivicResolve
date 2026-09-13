import { prisma } from "@/lib/prisma";
import { getSLAInfo, type SLAInfo } from "@/lib/sla";
import { createNotification } from "@/services/notification.service";
import type { SessionUser } from "@/types";
import { ComplaintStatus, NotificationType, Priority } from "@prisma/client";
import type { CreateSLARuleInput, UpdateSLARuleInput } from "@/schemas/admin.schema";

/**
 * SLA Monitoring Background Job Engine
 * Scans all unresolved complaints, evaluates live SLA deadlines against SLA rules,
 * and idempotently dispatches due-soon warnings & breach alerts to staff & managers.
 */
export async function runSLAMonitoringJob() {
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  // Unresolved statuses
  const activeStatuses: ComplaintStatus[] = [
    ComplaintStatus.SUBMITTED,
    ComplaintStatus.UNDER_REVIEW,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.REOPENED,
  ];

  const complaints = await prisma.complaint.findMany({
    where: {
      status: { in: activeStatuses },
    },
    include: {
      department: { select: { id: true, name: true, managerId: true } },
      assignedOfficer: { select: { id: true, name: true, email: true } },
    },
  });

  let checkedCount = 0;
  let dueSoonCount = 0;
  let breachedCount = 0;
  let notificationsSent = 0;

  for (const complaint of complaints) {
    checkedCount++;

    const slaInfo: SLAInfo = getSLAInfo(
      complaint.slaDeadline,
      complaint.status,
      slaRules,
      complaint.priority,
      complaint.createdAt
    );

    const managerId = complaint.department.managerId;
    const officerId = complaint.assignedOfficerId;

    if (slaInfo.status === "DUE_SOON") {
      dueSoonCount++;

      // 1. Notify Officer if assigned
      if (officerId) {
        const notif = await createNotification({
          userId: officerId,
          type: NotificationType.SLA_WARNING,
          title: `SLA Due Soon: ${complaint.complaintNumber}`,
          message: `Complaint ${complaint.complaintNumber} (${complaint.title}) is approaching its SLA deadline (${slaInfo.timeRemainingLabel}).`,
          complaintId: complaint.id,
          deduplicationKey: `SLA_WARN_OFFICER_${complaint.id}`,
        });
        if (notif) notificationsSent++;
      }

      // 2. Notify Department Manager
      if (managerId) {
        const notif = await createNotification({
          userId: managerId,
          type: NotificationType.SLA_WARNING,
          title: `Department SLA Alert: ${complaint.complaintNumber}`,
          message: `Complaint ${complaint.complaintNumber} in ${complaint.department.name} is approaching its SLA deadline.`,
          complaintId: complaint.id,
          deduplicationKey: `SLA_WARN_MGR_${complaint.id}`,
        });
        if (notif) notificationsSent++;
      }
    } else if (slaInfo.status === "BREACHED") {
      breachedCount++;

      // 1. Notify Officer if assigned
      if (officerId) {
        const notif = await createNotification({
          userId: officerId,
          type: NotificationType.SLA_BREACHED,
          title: `SLA Breached: ${complaint.complaintNumber}`,
          message: `Urgent: Complaint ${complaint.complaintNumber} (${complaint.title}) has breached its resolution SLA deadline!`,
          complaintId: complaint.id,
          deduplicationKey: `SLA_BREACH_OFFICER_${complaint.id}`,
        });
        if (notif) notificationsSent++;
      }

      // 2. Notify Department Manager
      if (managerId) {
        const notif = await createNotification({
          userId: managerId,
          type: NotificationType.SLA_BREACHED,
          title: `Department SLA Breach: ${complaint.complaintNumber}`,
          message: `Attention: Complaint ${complaint.complaintNumber} in ${complaint.department.name} has breached SLA!`,
          complaintId: complaint.id,
          deduplicationKey: `SLA_BREACH_MGR_${complaint.id}`,
        });
        if (notif) notificationsSent++;
      }

      // Record Audit Log for Breach Detection if not logged today
      const todayStr = new Date().toISOString().slice(0, 10);
      const auditDedupKey = `AUDIT_SLA_BREACH_${complaint.id}_${todayStr}`;
      
      const existingAudit = await prisma.auditLog.findFirst({
        where: {
          entity: "Complaint",
          entityId: complaint.id,
          action: "SLA_BREACH_DETECTED",
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });

      if (!existingAudit) {
        await prisma.auditLog.create({
          data: {
            actorId: null,
            action: "SLA_BREACH_DETECTED",
            entity: "Complaint",
            entityId: complaint.id,
            metadata: {
              complaintNumber: complaint.complaintNumber,
              priority: complaint.priority,
              slaDeadline: complaint.slaDeadline,
              deduplicationKey: auditDedupKey,
            },
          },
        });
      }
    }
  }

  return {
    checkedCount,
    dueSoonCount,
    breachedCount,
    notificationsSent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculates aggregated SLA statistics for role dashboards.
 */
export async function getSLADashboardStats(user: SessionUser) {
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  const where: any = {};
  if (user.role === "CITIZEN") {
    where.citizenId = user.id;
  } else if (user.role === "OFFICER") {
    if (user.departmentId) {
      where.OR = [
        { assignedOfficerId: user.id },
        { departmentId: user.departmentId },
      ];
    } else {
      where.assignedOfficerId = user.id;
    }
  } else if (user.role === "DEPARTMENT_MANAGER") {
    if (user.departmentId) {
      where.departmentId = user.departmentId;
    } else {
      where.departmentId = "NO_DEPT_ASSIGNED";
    }
  }

  const complaints = await prisma.complaint.findMany({
    where,
    select: {
      id: true,
      status: true,
      priority: true,
      slaDeadline: true,
      createdAt: true,
      resolvedAt: true,
      closedAt: true,
    },
  });

  let onTrack = 0;
  let dueSoon = 0;
  let breached = 0;
  let completedInSLA = 0;
  let completedAfterSLA = 0;

  for (const c of complaints) {
    if (
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.REJECTED
    ) {
      const resolutionDate = c.resolvedAt || c.closedAt || new Date();
      if (c.slaDeadline && resolutionDate.getTime() <= c.slaDeadline.getTime()) {
        completedInSLA++;
      } else {
        completedAfterSLA++;
      }
    } else {
      const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
      if (slaInfo.status === "BREACHED") breached++;
      else if (slaInfo.status === "DUE_SOON") dueSoon++;
      else onTrack++;
    }
  }

  const totalCompleted = completedInSLA + completedAfterSLA;
  const complianceRatePercent =
    totalCompleted > 0 ? Math.round((completedInSLA / totalCompleted) * 100) : 100;

  return {
    onTrack,
    dueSoon,
    breached,
    completedInSLA,
    completedAfterSLA,
    complianceRatePercent,
    totalComplaints: complaints.length,
  };
}

// ─────────────────────────────────────────────────────────────
// ADMIN SLA RULE MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Retrieves all SLA rules for admin management.
 */
export async function getSLARulesAdmin(currentUser: SessionUser) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const rules = await prisma.sLARule.findMany({
    orderBy: { priority: "asc" },
  });

  return rules;
}

/**
 * Creates or updates an SLA rule.
 * Business Rule: Changing an SLA rule MUST NOT alter existing Complaint.slaDeadline values.
 */
export async function upsertSLARuleAdmin(currentUser: SessionUser, input: CreateSLARuleInput) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  if (input.resolutionHours <= 0) {
    throw new Error("SLA resolution hours must be greater than 0.");
  }

  const existing = await prisma.sLARule.findUnique({
    where: { priority: input.priority },
  });

  return await prisma.$transaction(async (tx) => {
    const rule = await tx.sLARule.upsert({
      where: { priority: input.priority },
      create: {
        priority: input.priority,
        resolutionHours: input.resolutionHours,
        warningThresholdPercent: input.warningThresholdPercent ?? 80,
        isActive: input.isActive ?? true,
      },
      update: {
        resolutionHours: input.resolutionHours,
        warningThresholdPercent: input.warningThresholdPercent ?? 80,
        isActive: input.isActive ?? true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: existing ? "SLA_RULE_UPDATED" : "SLA_RULE_CREATED",
        entity: "SLARule",
        entityId: rule.id,
        metadata: {
          priority: rule.priority,
          resolutionHours: rule.resolutionHours,
          warningThresholdPercent: rule.warningThresholdPercent,
          isActive: rule.isActive,
          note: "Existing complaint SLA deadlines preserved.",
        },
      },
    });

    return rule;
  });
}

/**
 * Updates an SLA rule by ID.
 */
export async function updateSLARuleByIdAdmin(
  currentUser: SessionUser,
  id: string,
  input: UpdateSLARuleInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const existing = await prisma.sLARule.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("SLA rule not found");
  }

  if (input.resolutionHours !== undefined && input.resolutionHours <= 0) {
    throw new Error("SLA resolution hours must be greater than 0.");
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.sLARule.update({
      where: { id },
      data: {
        ...(input.resolutionHours !== undefined ? { resolutionHours: input.resolutionHours } : {}),
        ...(input.warningThresholdPercent !== undefined ? { warningThresholdPercent: input.warningThresholdPercent } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "SLA_RULE_UPDATED",
        entity: "SLARule",
        entityId: id,
        metadata: {
          priority: updated.priority,
          resolutionHours: updated.resolutionHours,
          warningThresholdPercent: updated.warningThresholdPercent,
          isActive: updated.isActive,
        },
      },
    });

    if (input.isActive !== undefined && input.isActive !== existing.isActive) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: input.isActive ? "SLA_RULE_ACTIVATED" : "SLA_RULE_DEACTIVATED",
          entity: "SLARule",
          entityId: id,
          metadata: { priority: updated.priority },
        },
      });
    }

    return updated;
  });
}
