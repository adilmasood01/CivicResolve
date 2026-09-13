import { z } from "zod";
import { Priority, ComplaintStatus, CommentType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// COMPLAINT SUBMISSION SCHEMA
// ─────────────────────────────────────────────────────────────

export const createComplaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(3000, "Description cannot exceed 3000 characters"),
  categoryId: z
    .string()
    .min(1, "Please select a valid category"),
  location: z
    .string()
    .trim()
    .min(3, "Location description must be at least 3 characters")
    .max(200, "Location cannot exceed 200 characters"),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .nullable(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITION SCHEMA
// ─────────────────────────────────────────────────────────────

export const updateStatusSchema = z.object({
  toStatus: z.nativeEnum(ComplaintStatus, {
    message: "Invalid complaint status",
  }),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason cannot exceed 1000 characters")
    .optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ─────────────────────────────────────────────────────────────
// ASSIGN OFFICER SCHEMA
// ─────────────────────────────────────────────────────────────

export const assignOfficerSchema = z.object({
  officerId: z
    .string()
    .nullable()
    .optional(),
});

export type AssignOfficerInput = z.infer<typeof assignOfficerSchema>;

// ─────────────────────────────────────────────────────────────
// COMMENT SCHEMA
// ─────────────────────────────────────────────────────────────

export const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
  type: z.nativeEnum(CommentType).default("PUBLIC_COMMENT"),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

// ─────────────────────────────────────────────────────────────
// COMPLAINT FILTERS SCHEMA
// ─────────────────────────────────────────────────────────────

export const filterComplaintSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
  citizenId: z.string().optional(),
  assignedOfficerId: z.string().optional(),
  slaStatus: z.enum(["ON_TRACK", "DUE_SOON", "BREACHED", "COMPLETED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  updatedFrom: z.string().optional(),
  updatedTo: z.string().optional(),
  slaDeadlineFrom: z.string().optional(),
  slaDeadlineTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "updatedAt", "priority", "slaDeadline", "complaintNumber", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type FilterComplaintInput = z.infer<typeof filterComplaintSchema>;

// ─────────────────────────────────────────────────────────────
// FILTER PRESET SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createPresetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Preset name must be at least 2 characters")
    .max(50, "Preset name cannot exceed 50 characters"),
  filters: z.record(z.string(), z.any()),
  isShared: z.boolean().optional().default(false),
});

export type CreatePresetInput = z.infer<typeof createPresetSchema>;

// ─────────────────────────────────────────────────────────────
// PUBLIC TRACKING
// ─────────────────────────────────────────────────────────────

export const trackComplaintSchema = z.object({
  complaintNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^CMP-\d{4}-\d{6}$/,
      "Use a complaint number like CMP-2026-000001"
    ),
});

export type TrackComplaintInput = z.infer<typeof trackComplaintSchema>;

