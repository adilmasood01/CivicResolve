import { z } from "zod";
import { Role, Priority } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT SCHEMAS
// ─────────────────────────────────────────────────────────────

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role, { message: "Invalid user role" }),
  departmentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const filterUserSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type FilterUserInput = z.infer<typeof filterUserSchema>;

// ─────────────────────────────────────────────────────────────
// DEPARTMENT MANAGEMENT SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters")
    .max(10, "Department code cannot exceed 10 characters")
    .toUpperCase(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  managerId: z.string().nullable().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// ─────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  departmentId: z.string().min(1, "Department assignment is required"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─────────────────────────────────────────────────────────────
// SLA RULE MANAGEMENT SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createSLARuleSchema = z.object({
  priority: z.nativeEnum(Priority, { message: "Invalid priority" }),
  resolutionHours: z
    .number()
    .int("Resolution hours must be an integer")
    .positive("SLA duration must be greater than 0 hours"),
  warningThresholdPercent: z
    .number()
    .int()
    .min(1, "Warning threshold must be at least 1%")
    .max(99, "Warning threshold must be at most 99%")
    .default(80),
  isActive: z.boolean().default(true),
});

export type CreateSLARuleInput = z.infer<typeof createSLARuleSchema>;

export const updateSLARuleSchema = createSLARuleSchema.partial();

export type UpdateSLARuleInput = z.infer<typeof updateSLARuleSchema>;

// ─────────────────────────────────────────────────────────────
// AUDIT LOG FILTERS SCHEMA
// ─────────────────────────────────────────────────────────────

export const filterAuditLogSchema = z.object({
  search: z.string().optional(),
  actorId: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type FilterAuditLogInput = z.infer<typeof filterAuditLogSchema>;
