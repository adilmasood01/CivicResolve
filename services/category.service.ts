import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/admin.schema";

/**
 * Retrieves categories for administrative management.
 */
export async function getCategoriesAdmin(
  currentUser: SessionUser,
  filters?: { departmentId?: string; search?: string }
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const where: any = {};
  if (filters?.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  const categories = await prisma.category.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, code: true, isActive: true } },
      _count: { select: { complaints: true } },
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return categories;
}

/**
 * Creates a new category.
 * Prevents duplicate category names within the same department.
 */
export async function createCategory(currentUser: SessionUser, input: CreateCategoryInput) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  // Validate department existence
  const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!dept) {
    throw new Error("Target department does not exist.");
  }
  if (!dept.isActive) {
    throw new Error("Cannot create category under an inactive department.");
  }

  // Check for duplicate category name within the same department
  const duplicate = await prisma.category.findFirst({
    where: {
      name: { equals: input.name, mode: "insensitive" },
      departmentId: input.departmentId,
    },
  });

  if (duplicate) {
    throw new Error(`Category '${input.name}' already exists in department '${dept.name}'.`);
  }

  return await prisma.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: {
        name: input.name,
        description: input.description,
        departmentId: input.departmentId,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "CATEGORY_CREATED",
        entity: "Category",
        entityId: category.id,
        metadata: {
          name: category.name,
          departmentId: category.departmentId,
          departmentName: dept.name,
        },
      },
    });

    return category;
  });
}

/**
 * Updates a category.
 */
export async function updateCategory(
  currentUser: SessionUser,
  id: string,
  input: UpdateCategoryInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { department: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const targetDeptId = input.departmentId ?? category.departmentId;

  // If name or department changed, verify duplicates
  if (input.name || input.departmentId) {
    const nameToCheck = input.name ?? category.name;
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: { equals: nameToCheck, mode: "insensitive" },
        departmentId: targetDeptId,
      },
    });

    if (duplicate) {
      throw new Error(`A category with name '${nameToCheck}' already exists in this department.`);
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "CATEGORY_UPDATED",
        entity: "Category",
        entityId: id,
        metadata: {
          name: updated.name,
          departmentId: updated.departmentId,
        },
      },
    });

    if (input.isActive !== undefined && input.isActive !== category.isActive) {
      await tx.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: input.isActive ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
          entity: "Category",
          entityId: id,
          metadata: { name: updated.name },
        },
      });
    }

    return updated;
  });
}
