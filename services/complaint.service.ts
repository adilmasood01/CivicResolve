import { prisma } from "@/lib/prisma";
import { can, canTransition } from "@/lib/permissions";
import { calculateSLADeadline, getSLAInfo } from "@/lib/sla";
import { generateComplaintNumber, getPaginationMeta } from "@/lib/utils";
import {
  createComplaintSchema,
  updateStatusSchema,
  addCommentSchema,
  filterComplaintSchema,
  type CreateComplaintInput,
  type UpdateStatusInput,
  type AddCommentInput,
  type FilterComplaintInput,
} from "@/schemas/complaint.schema";
import type {
  SessionUser,
  PaginatedResult,
  ComplaintDetail,
  SafeUser,
  PublicComplaintView,
} from "@/types";
import { ComplaintStatus, Priority, CommentType, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// SAFE USER SELECT FIELDS (never expose passwordHash)
// ─────────────────────────────────────────────────────────────
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  firstName: true,
  lastName: true,
  role: true,
  departmentId: true,
  isActive: true,
  createdAt: true,
} as const;

// ─────────────────────────────────────────────────────────────
// 1. CREATE COMPLAINT SERVICE
// ─────────────────────────────────────────────────────────────
export async function createComplaint(
  user: SessionUser,
  rawInput: CreateComplaintInput
) {
  // 1. Validate user auth & role permission
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:create"
  );
  if (!authorized) {
    throw new Error("Forbidden: You do not have permission to create complaints.");
  }

  // 2. Validate input schema
  const validated = createComplaintSchema.parse(rawInput);

  // 3. Verify category exists and find routing department
  const category = await prisma.category.findUnique({
    where: { id: validated.categoryId },
    include: { department: true },
  });

  if (!category || !category.isActive) {
    throw new Error("Invalid or inactive category selected");
  }

  if (!category.departmentId) {
    throw new Error("Category has no configured routing department");
  }

  const departmentId = category.departmentId;

  // 4. Authoritative priority determination (default MEDIUM for citizen submissions)
  const priority: Priority = Priority.MEDIUM;

  // 5. Fetch SLA rules from database
  const slaRules = await prisma.sLARule.findMany({
    where: { isActive: true },
  });

  // 6. Calculate SLA deadline
  const slaDeadline = calculateSLADeadline(priority, slaRules);

  // 7. Transaction: generate complaint number, create complaint, status history, audit log, notification
  const result = await prisma.$transaction(async (tx) => {
    // Generate unique complaint number based on total count + 1
    const count = await tx.complaint.count();
    let seq = count + 1;
    let complaintNumber = generateComplaintNumber(seq);

    // Collision fallback safety loop
    let existing = await tx.complaint.findUnique({ where: { complaintNumber } });
    while (existing) {
      seq += 1;
      complaintNumber = generateComplaintNumber(seq);
      existing = await tx.complaint.findUnique({ where: { complaintNumber } });
    }

    // Create Complaint record
    const complaint = await tx.complaint.create({
      data: {
        complaintNumber,
        title: validated.title,
        description: validated.description,
        priority,
        status: ComplaintStatus.SUBMITTED,
        location: validated.location,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        slaDeadline,
        categoryId: category.id,
        departmentId,
        citizenId: user.id,
      },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Create initial status history entry
    await tx.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        fromStatus: null,
        toStatus: ComplaintStatus.SUBMITTED,
        changedById: user.id,
        reason: "Initial complaint submission by citizen",
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "COMPLAINT_SUBMITTED",
        entity: "Complaint",
        entityId: complaint.id,
        metadata: {
          complaintNumber: complaint.complaintNumber,
          categoryId: category.id,
          departmentId,
          priority,
        },
      },
    });

    // Create in-app notification for the citizen
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "COMPLAINT_SUBMITTED",
        title: "Complaint Submitted Successfully",
        message: `Your complaint ${complaint.complaintNumber} (${complaint.title}) has been submitted and routed to ${category.department?.name}.`,
        complaintId: complaint.id,
      },
    });

    return complaint;
  });

  return result;
}

// ─────────────────────────────────────────────────────────────
// 2. GET COMPLAINTS SERVICE (PAGINATED & ROLE-SCOPED)
// ─────────────────────────────────────────────────────────────
export async function getComplaints(
  user: SessionUser,
  rawFilters: FilterComplaintInput
): Promise<PaginatedResult<any>> {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const isPermitted = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:view"
  );
  if (!isPermitted) {
    throw new Error("Forbidden: You do not have permission to view complaints.");
  }

  const filters = filterComplaintSchema.parse(rawFilters);

  // Build base query condition
  const where: Prisma.ComplaintWhereInput = {};

  // Enforce role-based data scoping strictly on the server
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
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      } else {
        // If manager has no assigned department, show empty
        where.departmentId = "NO_DEPT_ASSIGNED";
      }
      break;

    case "ADMIN":
      // Unrestricted - admin can view all
      break;
  }

  // Additional user-supplied filters
  if (filters.search) {
    const searchTerm = filters.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { complaintNumber: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { location: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.departmentId && user.role === "ADMIN") where.departmentId = filters.departmentId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.citizenId && (user.role === "ADMIN" || user.role === "DEPARTMENT_MANAGER")) {
    where.citizenId = filters.citizenId;
  }
  if (filters.assignedOfficerId) where.assignedOfficerId = filters.assignedOfficerId;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  if (filters.updatedFrom || filters.updatedTo) {
    where.updatedAt = {
      ...(filters.updatedFrom ? { gte: new Date(filters.updatedFrom) } : {}),
      ...(filters.updatedTo ? { lte: new Date(filters.updatedTo) } : {}),
    };
  }

  if (filters.slaDeadlineFrom || filters.slaDeadlineTo) {
    where.slaDeadline = {
      ...(filters.slaDeadlineFrom ? { gte: new Date(filters.slaDeadlineFrom) } : {}),
      ...(filters.slaDeadlineTo ? { lte: new Date(filters.slaDeadlineTo) } : {}),
    };
  }

  // Count total matching complaints
  const total = await prisma.complaint.count({ where });

  // Calculate pagination bounds
  const page = filters.page;
  const pageSize = filters.pageSize;
  const skip = (page - 1) * pageSize;

  // Execute database query
  const rawComplaints = await prisma.complaint.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { [filters.sortBy]: filters.sortOrder },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
      citizen: { select: { id: true, name: true, email: true } },
      assignedOfficer: { select: { id: true, name: true, email: true } },
    },
  });

  // Fetch SLA rules for computing live SLA status
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });

  // Compute live SLA info for each complaint
  const data = rawComplaints.map((c) => {
    const slaInfo = getSLAInfo(c.slaDeadline, c.status, slaRules, c.priority, c.createdAt);
    return {
      ...c,
      slaInfo,
    };
  });

  // Optional secondary filter for slaStatus if passed
  let filteredData = data;
  if (filters.slaStatus) {
    filteredData = data.filter((c) => c.slaInfo.status === filters.slaStatus);
  }

  return {
    data: filteredData,
    meta: getPaginationMeta(total, page, pageSize),
  };
}

// ─────────────────────────────────────────────────────────────
// 3. GET COMPLAINT BY ID SERVICE (AUTHORIZATION & IDOR PROTECTED)
// ─────────────────────────────────────────────────────────────
export async function getComplaintById(
  user: SessionUser,
  id: string
): Promise<ComplaintDetail | null> {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      category: true,
      department: true,
      citizen: { select: SAFE_USER_SELECT },
      assignedOfficer: { select: SAFE_USER_SELECT },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: {
          changedBy: { select: SAFE_USER_SELECT },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: SAFE_USER_SELECT },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: SAFE_USER_SELECT },
        },
      },
      rating: true,
    },
  });

  if (!complaint) return null;

  // Perform strict server-side authorization check via permission engine
  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:view",
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!authorized) {
    return null; // Safe 404 response
  }

  // IDOR & Data Leakage Protection:
  // If requester is a CITIZEN, filter out internal notes from the comments list
  if (user.role === "CITIZEN") {
    complaint.comments = complaint.comments.filter(
      (c) => c.type === CommentType.PUBLIC_COMMENT
    );
  }

  return complaint as unknown as ComplaintDetail;
}

// ─────────────────────────────────────────────────────────────
// 4. UPDATE COMPLAINT STATUS SERVICE
// ─────────────────────────────────────────────────────────────
export async function updateComplaintStatus(
  user: SessionUser,
  complaintId: string,
  rawInput: UpdateStatusInput
) {
  const validated = updateStatusSchema.parse(rawInput);

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Map target status to specific action permission
  let targetAction: any = "complaint:update-status";
  if (validated.toStatus === ComplaintStatus.RESOLVED) targetAction = "complaint:resolve";
  else if (validated.toStatus === ComplaintStatus.CLOSED) targetAction = "complaint:close";
  else if (validated.toStatus === ComplaintStatus.REJECTED) targetAction = "complaint:reject";
  else if (validated.toStatus === ComplaintStatus.REOPENED) targetAction = "complaint:reopen";

  const actionPermitted = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    targetAction,
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  // Verify transition validity and authorization
  const allowed = canTransition(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    complaint.status,
    validated.toStatus,
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!actionPermitted || !allowed) {
    throw new Error(`Forbidden: Status transition from ${complaint.status} to ${validated.toStatus} is not permitted.`);
  }

  // Prepare dates if resolving or closing
  const now = new Date();
  const resolvedAt = validated.toStatus === ComplaintStatus.RESOLVED ? now : complaint.resolvedAt;
  const closedAt = validated.toStatus === ComplaintStatus.CLOSED ? now : complaint.closedAt;

  // Execute database transaction
  const updatedComplaint = await prisma.$transaction(async (tx) => {
    // 1. Update Complaint status
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: validated.toStatus,
        resolvedAt,
        closedAt,
      },
    });

    // 2. Append Status History
    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: complaint.status,
        toStatus: validated.toStatus,
        changedById: user.id,
        reason: validated.reason || `Status updated to ${validated.toStatus}`,
      },
    });

    // 3. Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "COMPLAINT_STATUS_UPDATED",
        entity: "Complaint",
        entityId: complaintId,
        metadata: {
          complaintNumber: complaint.complaintNumber,
          fromStatus: complaint.status,
          toStatus: validated.toStatus,
          reason: validated.reason,
        },
      },
    });

    // 4. Create Notification
    // Notify Citizen if action performed by staff, notify Assigned Officer if action performed by Citizen
    if (user.id !== complaint.citizenId) {
      await tx.notification.create({
        data: {
          userId: complaint.citizenId,
          type: validated.toStatus === ComplaintStatus.RESOLVED
            ? "COMPLAINT_RESOLVED"
            : validated.toStatus === ComplaintStatus.CLOSED
            ? "COMPLAINT_CLOSED"
            : "STATUS_UPDATED",
          title: `Complaint Status Updated: ${validated.toStatus}`,
          message: `Your complaint ${complaint.complaintNumber} has been updated to status: ${validated.toStatus}.`,
          complaintId: complaint.id,
        },
      });
    }

    return updated;
  });

  return updatedComplaint;
}

// ─────────────────────────────────────────────────────────────
// 5. ADD COMMENT SERVICE
// ─────────────────────────────────────────────────────────────
export async function addComment(
  user: SessionUser,
  complaintId: string,
  rawInput: AddCommentInput
) {
  const validated = addCommentSchema.parse(rawInput);

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Authorization checks
  const isCitizen = user.role === "CITIZEN";

  if (isCitizen) {
    // Citizens CANNOT create internal notes
    if (validated.type === CommentType.INTERNAL_NOTE) {
      throw new Error("Forbidden: Citizens cannot create internal notes.");
    }
    // Must own the complaint
    if (complaint.citizenId !== user.id) {
      throw new Error("Forbidden: You cannot comment on this complaint.");
    }
  } else {
    // Staff/Manager/Admin must have access to complaint
    const authorized = can(
      { id: user.id, role: user.role, departmentId: user.departmentId },
      validated.type === CommentType.INTERNAL_NOTE ? "complaint:add-internal-note" : "complaint:add-public-comment",
      {
        citizenId: complaint.citizenId,
        departmentId: complaint.departmentId,
        assignedOfficerId: complaint.assignedOfficerId,
        status: complaint.status,
      }
    );
    if (!authorized) {
      throw new Error("Forbidden: You are not authorized to comment on this complaint.");
    }
  }

  // Execute transaction
  const comment = await prisma.$transaction(async (tx) => {
    const newComment = await tx.complaintComment.create({
      data: {
        complaintId,
        authorId: user.id,
        content: validated.content,
        type: validated.type,
      },
      include: {
        author: { select: SAFE_USER_SELECT },
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: validated.type === CommentType.INTERNAL_NOTE ? "INTERNAL_NOTE_ADDED" : "PUBLIC_COMMENT_ADDED",
        entity: "ComplaintComment",
        entityId: newComment.id,
        metadata: {
          complaintId,
          type: validated.type,
        },
      },
    });

    // Notify relevant user
    if (validated.type === CommentType.PUBLIC_COMMENT) {
      if (user.id === complaint.citizenId) {
        // If citizen commented, notify assigned officer (if any)
        if (complaint.assignedOfficerId) {
          await tx.notification.create({
            data: {
              userId: complaint.assignedOfficerId,
              type: "COMMENT_ADDED",
              title: `New Comment on ${complaint.complaintNumber}`,
              message: `${user.name || "Citizen"} added a comment to complaint ${complaint.complaintNumber}.`,
              complaintId,
            },
          });
        }
      } else {
        // If staff commented publicly, notify citizen
        await tx.notification.create({
          data: {
            userId: complaint.citizenId,
            type: "COMMENT_ADDED",
            title: `New Comment on ${complaint.complaintNumber}`,
            message: `An update was posted on your complaint ${complaint.complaintNumber}.`,
            complaintId,
          },
        });
      }
    }

    return newComment;
  });

  return comment;
}

// ─────────────────────────────────────────────────────────────
// 6. PUBLIC TRACKING (no PII, no login required)
// ─────────────────────────────────────────────────────────────
export async function getPublicComplaintByNumber(
  complaintNumber: string
): Promise<PublicComplaintView | null> {
  const complaint = await prisma.complaint.findUnique({
    where: { complaintNumber },
    select: {
      complaintNumber: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { toStatus: true, createdAt: true },
      },
    },
  });

  if (!complaint) return null;

  return {
    complaintNumber: complaint.complaintNumber,
    title: complaint.title,
    status: complaint.status,
    categoryName: complaint.category.name,
    departmentName: complaint.department.name,
    submittedAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    timeline: complaint.statusHistory,
  };
}
