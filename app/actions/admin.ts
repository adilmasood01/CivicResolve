"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  updateUserSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createCategorySchema,
  updateCategorySchema,
  createSLARuleSchema,
} from "@/schemas/admin.schema";
import { updateUserRoleAndDepartment } from "@/services/user.service";
import { createDepartment, updateDepartment } from "@/services/department.service";
import { createCategory, updateCategory } from "@/services/category.service";
import { upsertSLARuleAdmin, updateSLARuleByIdAdmin } from "@/services/sla.service";
import { Role, Priority } from "@prisma/client";

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server Action to update a user's role, department, or active status.
 * Enforces ADMIN role server-side.
 */
export async function updateUserAction(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const roleRaw = formData.get("role") as string;
  const deptRaw = formData.get("departmentId") as string;
  const activeRaw = formData.get("isActive");

  const raw = {
    role: roleRaw as Role,
    departmentId: deptRaw === "" ? null : deptRaw,
    isActive: activeRaw === "true" || activeRaw === "on",
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await updateUserRoleAndDepartment(adminUser, userId, parsed.data);
    revalidatePath("/admin/users");
    revalidatePath("/admin/staff");
    return { success: true, message: "User updated successfully" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update user" };
  }
}

/**
 * Server Action to create a new department.
 */
export async function createDepartmentAction(formData: FormData): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const managerRaw = formData.get("managerId") as string;

  const raw = {
    name: formData.get("name") as string,
    code: (formData.get("code") as string)?.toUpperCase(),
    description: formData.get("description") as string,
    managerId: managerRaw === "" ? null : managerRaw,
  };

  const parsed = createDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await createDepartment(adminUser, parsed.data);
    revalidatePath("/admin/departments");
    return { success: true, message: "Department created successfully" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create department" };
  }
}

/**
 * Server Action to update an existing department.
 */
export async function updateDepartmentAction(
  departmentId: string,
  formData: FormData
): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const managerRaw = formData.get("managerId") as string;
  const activeRaw = formData.get("isActive");

  const raw = {
    name: formData.get("name") as string,
    code: (formData.get("code") as string)?.toUpperCase(),
    description: formData.get("description") as string,
    managerId: managerRaw === "" ? null : managerRaw,
    isActive: activeRaw === "true" || activeRaw === "on",
  };

  const parsed = updateDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await updateDepartment(adminUser, departmentId, parsed.data);
    revalidatePath("/admin/departments");
    return { success: true, message: "Department updated successfully" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update department" };
  }
}

/**
 * Server Action to create a new complaint category.
 */
export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    departmentId: formData.get("departmentId") as string,
  };

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await createCategory(adminUser, parsed.data);
    revalidatePath("/admin/categories");
    return { success: true, message: "Category created successfully" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create category" };
  }
}

/**
 * Server Action to update an existing category.
 */
export async function updateCategoryAction(
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const activeRaw = formData.get("isActive");

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    departmentId: formData.get("departmentId") as string,
    isActive: activeRaw === "true" || activeRaw === "on",
  };

  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await updateCategory(adminUser, categoryId, parsed.data);
    revalidatePath("/admin/categories");
    return { success: true, message: "Category updated successfully" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update category" };
  }
}

/**
 * Server Action to create or update an SLA rule.
 */
export async function saveSLARuleAction(formData: FormData): Promise<ActionResult> {
  const adminUser = await requireRole("ADMIN");

  const activeRaw = formData.get("isActive");

  const raw = {
    priority: formData.get("priority") as Priority,
    resolutionHours: Number(formData.get("resolutionHours")),
    warningThresholdPercent: Number(formData.get("warningThresholdPercent") || 80),
    isActive: activeRaw === "true" || activeRaw === "on" || activeRaw === null ? true : activeRaw === "false" ? false : true,
  };

  const parsed = createSLARuleSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    await upsertSLARuleAdmin(adminUser, parsed.data);
    revalidatePath("/admin/sla");
    return { success: true, message: "SLA rule saved successfully. Historical complaint deadlines preserved." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save SLA rule" };
  }
}
