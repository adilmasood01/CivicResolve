/**
 * Shared TypeScript types for CivicResolve.
 *
 * These types are derived from or extend the Prisma-generated types
 * and provide a stable contract between layers (services, API, UI).
 */

import type {
  User,
  Complaint,
  ComplaintComment,
  ComplaintAttachment,
  ComplaintStatusHistory,
  Department,
  Category,
  SLARule,
  Notification,
  Rating,
  AuditLog,
  Role,
  Priority,
  ComplaintStatus,
  CommentType,
  NotificationType,
} from "@prisma/client";

export type {
  Role,
  Priority,
  ComplaintStatus,
  CommentType,
  NotificationType,
};

// ─────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────

/** Safe user shape — never include passwordHash */
export type SafeUser = Omit<User, "passwordHash">;

export type UserWithDepartment = SafeUser & {
  department: Department | null;
};

// ─────────────────────────────────────────────────────────────
// COMPLAINT TYPES
// ─────────────────────────────────────────────────────────────

export type ComplaintSummary = Pick<
  Complaint,
  | "id"
  | "complaintNumber"
  | "title"
  | "priority"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "slaDeadline"
  | "departmentId"
  | "categoryId"
> & {
  department: Pick<Department, "id" | "name">;
  category: Pick<Category, "id" | "name">;
};

export type ComplaintDetail = Complaint & {
  citizen: SafeUser;
  assignedOfficer: SafeUser | null;
  department: Department;
  category: Category;
  statusHistory: (ComplaintStatusHistory & {
    changedBy: SafeUser;
  })[];
  comments: (ComplaintComment & { author: SafeUser })[];
  attachments: (ComplaintAttachment & { uploadedBy: SafeUser })[];
  rating: Rating | null;
};

// ─────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────
// COMPLAINT FILTERS
// ─────────────────────────────────────────────────────────────

export interface ComplaintFilters {
  search?: string;
  status?: ComplaintStatus;
  priority?: Priority;
  departmentId?: string;
  categoryId?: string;
  citizenId?: string;
  assignedOfficerId?: string;
  slaStatus?: "ON_TRACK" | "DUE_SOON" | "BREACHED" | "COMPLETED";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "slaDeadline";
  sortOrder?: "asc" | "desc";
}

// ─────────────────────────────────────────────────────────────
// SESSION / AUTH TYPES
// ─────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  departmentId: string | null;
  image: string | null;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STAT TYPES
// ─────────────────────────────────────────────────────────────

export interface ComplaintStats {
  total: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
  reopened: number;
  slaBreached: number;
  slaDueSoon: number;
}

export interface DepartmentStats extends ComplaintStats {
  department: Pick<Department, "id" | "name">;
  avgResolutionHours: number | null;
  officerCount: number;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────────────────────────

export type NotificationWithComplaint = Notification & {
  complaint: Pick<Complaint, "id" | "complaintNumber" | "title"> | null;
};

// ─────────────────────────────────────────────────────────────
// AUDIT LOG TYPES
// ─────────────────────────────────────────────────────────────

export type AuditLogWithActor = AuditLog & {
  actor: SafeUser | null;
};

// ─────────────────────────────────────────────────────────────
// SLA RULE TYPES
// ─────────────────────────────────────────────────────────────

export type { SLARule };
