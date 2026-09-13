import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { assignOfficerSchema, type AssignOfficerInput } from "@/schemas/complaint.schema";
import type { SessionUser } from "@/types";
import { SAFE_USER_SELECT } from "./complaint.service";
import { ComplaintStatus } from "@prisma/client";

/**
 * Assigns or reassigns an officer to a complaint.
 * Restricted to DEPARTMENT_MANAGER (within department) and ADMIN (system-wide).
 */
export async function assignOfficer(
  user: SessionUser,
  complaintId: string,
  rawInput: AssignOfficerInput
) {
  const validated = assignOfficerSchema.parse(rawInput);

  // 1. Fetch complaint
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // 2. Authorization check
  const action = complaint.assignedOfficerId ? "complaint:reassign" : "complaint:assign";
  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    action,
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!authorized) {
    throw new Error("Forbidden: You do not have permission to assign officers to this complaint.");
  }

  // 3. Verify target officer (if non-null)
  let officer = null;
  if (validated.officerId) {
    officer = await prisma.user.findUnique({
      where: { id: validated.officerId },
      select: SAFE_USER_SELECT,
    });

    if (!officer || officer.role !== "OFFICER") {
      throw new Error("Selected user is not an active Officer.");
    }

    // Verify officer belongs to the complaint's department (unless ADMIN override)
    if (user.role !== "ADMIN" && officer.departmentId !== complaint.departmentId) {
      throw new Error("Officer must belong to the complaint's assigned department.");
    }
  }

  // 4. Transaction: update assignment, update status to ASSIGNED if SUBMITTED or UNDER_REVIEW, create history, audit log, notification
  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const shouldAutoAssignStatus =
      validated.officerId &&
      (complaint.status === ComplaintStatus.SUBMITTED ||
        complaint.status === ComplaintStatus.UNDER_REVIEW);

    const targetStatus = shouldAutoAssignStatus
      ? ComplaintStatus.ASSIGNED
      : complaint.status;

    // Update Complaint
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        assignedOfficerId: validated.officerId ?? null,
        status: targetStatus,
      },
      include: {
        assignedOfficer: { select: SAFE_USER_SELECT },
        department: { select: { id: true, name: true } },
      },
    });

    // If status changed to ASSIGNED, record history
    if (shouldAutoAssignStatus) {
      await tx.complaintStatusHistory.create({
        data: {
          complaintId,
          fromStatus: complaint.status,
          toStatus: ComplaintStatus.ASSIGNED,
          changedById: user.id,
          reason: `Assigned to officer ${officer?.name ?? officer?.email}`,
        },
      });
    }

    // Record audit log
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: validated.officerId ? "OFFICER_ASSIGNED" : "OFFICER_UNASSIGNED",
        entity: "Complaint",
        entityId: complaintId,
        metadata: {
          complaintNumber: complaint.complaintNumber,
          officerId: validated.officerId,
          officerName: officer?.name,
        },
      },
    });

    // Send notifications
    if (validated.officerId && officer) {
      // Notify Officer
      await tx.notification.create({
        data: {
          userId: officer.id,
          type: "COMPLAINT_ASSIGNED",
          title: "New Complaint Assigned",
          message: `Complaint ${complaint.complaintNumber} (${complaint.title}) has been assigned to you.`,
          complaintId,
        },
      });

      // Notify Citizen
      await tx.notification.create({
        data: {
          userId: complaint.citizenId,
          type: "COMPLAINT_ASSIGNED",
          title: "Officer Assigned",
          message: `An officer has been assigned to handle your complaint ${complaint.complaintNumber}.`,
          complaintId,
        },
      });
    }

    return updated;
  });

  return updatedComplaint;
}
