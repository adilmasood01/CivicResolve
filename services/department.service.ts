import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/schemas/admin.schema";
import { Role } from "@prisma/client";

/**
 * Retrieves all departments with aggregated metrics.
 */
export async function getDepartmentsAdmin(currentUser: SessionUser) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const departments = await prisma.department.findMany({
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          staff: true,
          categories: true,
          complaints: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate complaint breakdowns for each department
  const result = await Promise.all(
    departments.map(async (dept) => {
      const [openComplaints, resolvedComplaints, breachedSLAComplaints] = await Promise.all([
        prisma.complaint.count({
          where: {
            departmentId: dept.id,
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
          },
        }),
        prisma.complaint.count({
          where: {
            departmentId: dept.id,
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        }),
        prisma.complaint.count({
          where: {
            departmentId: dept.id,
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
            slaDeadline: { lt: new Date() },
          },
        }),
      ]);

      return {
        ...dept,
        stats: {
          openComplaints,
          resolvedComplaints,
          breachedSLAComplaints,
        },
      };
    })
  );

  return result;
}

/**
 * Retrieves a single department's detailed record.
 */
export async function getDepartmentByIdAdmin(currentUser: SessionUser, id: string) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      staff: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      categories: {
        select: { id: true, name: true, isActive: true },
      },
    },
  });

  if (!dept) {
    throw new Error("Department not found");
  }

  return dept;
}

/**
 * Creates a new department.
 */
export async function createDepartment(currentUser: SessionUser, input: CreateDepartmentInput) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const existingCode = await prisma.department.findUnique({
    where: { code: input.code },
  });
  if (existingCode) {
    throw new Error(`Department code '${input.code}' is already in use.`);
  }

  const existingName = await prisma.department.findUnique({
    where: { name: input.name },
  });
  if (existingName) {
    throw new Error(`Department name '${input.name}' already exists.`);
  }

  if (input.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: input.managerId } });
    if (!manager) {
      throw new Error("Selected manager user does not exist.");
    }
  }

  return await prisma.$transaction(async (tx) => {
    const newDept = await tx.department.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        managerId: input.managerId ?? null,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // If manager was assigned, ensure their role and department association are updated
    if (input.managerId) {
      await tx.user.update({
        where: { id: input.managerId },
        data: {
          role: Role.DEPARTMENT_MANAGER,
          departmentId: newDept.id,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "DEPARTMENT_CREATED",
        entity: "Department",
        entityId: newDept.id,
        metadata: {
          name: newDept.name,
          code: newDept.code,
          managerId: newDept.managerId,
        },
      },
    });

    return newDept;
  });
}

/**
 * Updates an existing department.
 */
export async function updateDepartment(
  currentUser: SessionUser,
  id: string,
  input: UpdateDepartmentInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new Error("Department not found");
  }

  if (input.code && input.code !== dept.code) {
    const existingCode = await prisma.department.findUnique({ where: { code: input.code } });
    if (existingCode) throw new Error(`Department code '${input.code}' is already in use.`);
  }

  if (input.name && input.name !== dept.name) {
    const existingName = await prisma.department.findUnique({ where: { name: input.name } });
    if (existingName) throw new Error(`Department name '${input.name}' already exists.`);
  }

  if (input.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: input.managerId } });
    if (!manager) throw new Error("Selected manager user does not exist.");
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.code ? { code: input.code } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // Update assigned manager user if changed
    if (input.managerId && input.managerId !== dept.managerId) {
      await tx.user.update({
        where: { id: input.managerId },
        data: {
          role: Role.DEPARTMENT_MANAGER,
          departmentId: updated.id,
        },
      });
    }

    // Audit logs
    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "DEPARTMENT_UPDATED",
        entity: "Department",
        entityId: id,
        metadata: {
          name: updated.name,
          code: updated.code,
          managerId: updated.managerId,
        },
      },
    });

    if (input.isActive !== undefined && input.isActive !== dept.isActive) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: input.isActive ? "DEPARTMENT_ACTIVATED" : "DEPARTMENT_DEACTIVATED",
          entity: "Department",
          entityId: id,
          metadata: { name: updated.name, code: updated.code },
        },
      });
    }

    return updated;
  });
}
