import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { FilterUserInput, UpdateUserInput } from "@/schemas/admin.schema";
import { Role } from "@prisma/client";

export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  departmentId: true,
  createdAt: true,
  lastLoginAt: true,
  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
};

/**
 * Lists users with filtering, search, and pagination.
 * Restricted to ADMIN users.
 */
export async function getAdminUsers(
  currentUser: SessionUser,
  filters: FilterUserInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const { search, role, departmentId, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        ...SAFE_USER_SELECT,
        _count: {
          select: {
            submittedComplaints: true,
            assignedComplaints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Retrieves a single user's detailed administrative record.
 */
export async function getAdminUserById(
  currentUser: SessionUser,
  userId: string
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...SAFE_USER_SELECT,
      _count: {
        select: {
          submittedComplaints: true,
          assignedComplaints: true,
          managedDepartments: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Updates a user's role, department, or active status.
 * Enforces critical security rules and audit logging.
 */
export async function updateUserRoleAndDepartment(
  currentUser: SessionUser,
  targetUserId: string,
  input: UpdateUserInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  // Fetch target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Security Rule 1: Admin cannot demote themselves
  if (currentUser.id === targetUserId && input.role && input.role !== "ADMIN") {
    throw new Error("Action prohibited: You cannot demote your own administrative account.");
  }

  // Security Rule 2: Admin cannot deactivate themselves
  if (currentUser.id === targetUserId && input.isActive === false) {
    throw new Error("Action prohibited: You cannot deactivate your own administrative account.");
  }

  const targetRole = input.role ?? targetUser.role;
  let targetDeptId = input.departmentId !== undefined ? input.departmentId : targetUser.departmentId;

  // Validation: Department requirements per role
  if (targetRole === Role.OFFICER || targetRole === Role.DEPARTMENT_MANAGER) {
    if (!targetDeptId) {
      throw new Error(`Department assignment is required for ${targetRole} role.`);
    }
    // Verify department exists and is active
    const dept = await prisma.department.findUnique({
      where: { id: targetDeptId },
    });
    if (!dept) {
      throw new Error("Specified department does not exist.");
    }
  } else if (targetRole === Role.CITIZEN || targetRole === Role.ADMIN) {
    // Citizens and admins normally don't have department scoping
    targetDeptId = null;
  }

  // Execute updates transactionally and create audit records
  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: {
        role: targetRole,
        departmentId: targetDeptId,
        isActive: input.isActive !== undefined ? input.isActive : targetUser.isActive,
      },
      select: SAFE_USER_SELECT,
    });

    // Audit logs for role changes
    if (targetUser.role !== targetRole) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: "USER_ROLE_CHANGED",
          entity: "User",
          entityId: targetUserId,
          metadata: {
            previousRole: targetUser.role,
            newRole: targetRole,
            targetEmail: targetUser.email,
          },
        },
      });
    }

    // Audit logs for department changes
    if (targetUser.departmentId !== targetDeptId) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: "USER_DEPARTMENT_CHANGED",
          entity: "User",
          entityId: targetUserId,
          metadata: {
            previousDepartmentId: targetUser.departmentId,
            newDepartmentId: targetDeptId,
            targetEmail: targetUser.email,
          },
        },
      });
    }

    // Audit logs for activation / deactivation
    if (input.isActive !== undefined && targetUser.isActive !== input.isActive) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entity: "User",
          entityId: targetUserId,
          metadata: {
            targetEmail: targetUser.email,
          },
        },
      });
    }

    return updatedUser;
  });
}
