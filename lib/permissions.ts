import { Role, ComplaintStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

/**
 * Minimal user shape required by the permission system.
 * Intentionally lean — only what's needed to check permissions.
 */
export interface PermissionUser {
  id: string;
  role: Role;
  departmentId: string | null;
}

/**
 * Minimal complaint shape required for ownership / department checks.
 */
export interface PermissionComplaint {
  citizenId: string;
  departmentId: string;
  assignedOfficerId: string | null;
  status: ComplaintStatus;
}

// ─────────────────────────────────────────────────────────────
// ACTION REGISTRY
// ─────────────────────────────────────────────────────────────

export type Action =
  // Complaints
  | "complaint:view"
  | "complaint:create"
  | "complaint:update-status"
  | "complaint:assign"
  | "complaint:reassign"
  | "complaint:change-priority"
  | "complaint:resolve"
  | "complaint:close"
  | "complaint:reject"
  | "complaint:reopen"
  | "complaint:rate"
  | "complaint:view-internal"
  | "complaint:add-public-comment"
  | "complaint:add-internal-note"
  | "complaint:upload-attachment"
  | "complaint:confirm-resolution"
  // Users
  | "user:manage"
  | "user:view-list"
  // Departments
  | "department:manage"
  | "department:view-analytics"
  // Categories
  | "category:manage"
  // SLA
  | "sla:manage"
  // Audit
  | "audit:view"
  // Analytics
  | "analytics:view-system"
  | "analytics:view-department";

// ─────────────────────────────────────────────────────────────
// PERMISSION MATRIX (role-only checks, no resource needed)
// ─────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Set<Action>> = {
  ADMIN: new Set<Action>([
    "complaint:view",
    "complaint:create",
    "complaint:update-status",
    "complaint:assign",
    "complaint:reassign",
    "complaint:change-priority",
    "complaint:resolve",
    "complaint:close",
    "complaint:reject",
    "complaint:reopen",
    "complaint:view-internal",
    "complaint:add-public-comment",
    "complaint:add-internal-note",
    "complaint:upload-attachment",
    "user:manage",
    "user:view-list",
    "department:manage",
    "department:view-analytics",
    "category:manage",
    "sla:manage",
    "audit:view",
    "analytics:view-system",
    "analytics:view-department",
  ]),

  DEPARTMENT_MANAGER: new Set<Action>([
    "complaint:view",
    "complaint:update-status",
    "complaint:assign",
    "complaint:reassign",
    "complaint:change-priority",
    "complaint:resolve",
    "complaint:close",
    "complaint:reject",
    "complaint:reopen",
    "complaint:view-internal",
    "complaint:add-public-comment",
    "complaint:add-internal-note",
    "complaint:upload-attachment",
    "user:view-list",
    "department:view-analytics",
    "analytics:view-department",
  ]),

  OFFICER: new Set<Action>([
    "complaint:view",
    "complaint:update-status",
    "complaint:resolve",
    "complaint:view-internal",
    "complaint:add-public-comment",
    "complaint:add-internal-note",
    "complaint:upload-attachment",
  ]),

  CITIZEN: new Set<Action>([
    "complaint:view",
    "complaint:create",
    "complaint:add-public-comment",
    "complaint:upload-attachment",
    "complaint:confirm-resolution",
    "complaint:reopen",
    "complaint:rate",
  ]),
};

// ─────────────────────────────────────────────────────────────
// VALID STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Partial<Record<ComplaintStatus, ComplaintStatus[]>> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "UNDER_REVIEW"],
  IN_PROGRESS: ["RESOLVED", "UNDER_REVIEW"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"],
};

/**
 * Roles that can perform each status transition.
 * ADMIN can always perform any transition.
 */
const TRANSITION_ROLES: Partial<Record<`${ComplaintStatus}->${ComplaintStatus}`, Role[]>> = {
  "SUBMITTED->UNDER_REVIEW": ["ADMIN", "DEPARTMENT_MANAGER"],
  "SUBMITTED->REJECTED": ["ADMIN", "DEPARTMENT_MANAGER"],
  "UNDER_REVIEW->ASSIGNED": ["ADMIN", "DEPARTMENT_MANAGER"],
  "UNDER_REVIEW->REJECTED": ["ADMIN", "DEPARTMENT_MANAGER"],
  "ASSIGNED->IN_PROGRESS": ["ADMIN", "DEPARTMENT_MANAGER", "OFFICER"],
  "ASSIGNED->UNDER_REVIEW": ["ADMIN", "DEPARTMENT_MANAGER"],
  "IN_PROGRESS->RESOLVED": ["ADMIN", "DEPARTMENT_MANAGER", "OFFICER"],
  "IN_PROGRESS->UNDER_REVIEW": ["ADMIN", "DEPARTMENT_MANAGER"],
  "RESOLVED->CLOSED": ["ADMIN", "DEPARTMENT_MANAGER", "CITIZEN"],
  "RESOLVED->REOPENED": ["ADMIN", "CITIZEN"],
  "REOPENED->UNDER_REVIEW": ["ADMIN", "DEPARTMENT_MANAGER"],
  "REOPENED->ASSIGNED": ["ADMIN", "DEPARTMENT_MANAGER"],
  "REOPENED->IN_PROGRESS": ["ADMIN", "DEPARTMENT_MANAGER", "OFFICER"],
};

// ─────────────────────────────────────────────────────────────
// MAIN PERMISSION FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Central permission check.
 *
 * Usage:
 *   can(user, "complaint:view", complaint)
 *   can(user, "user:manage")
 *
 * Always call this on the SERVER before returning or mutating data.
 * Never rely on frontend checks as the sole protection.
 */
export function can(
  user: PermissionUser,
  action: Action,
  resource?: PermissionComplaint
): boolean {
  // ADMIN is always allowed (role-level)
  if (user.role === "ADMIN") return true;

  // Check role-level permission first
  if (!ROLE_PERMISSIONS[user.role].has(action)) return false;

  // Resource-level checks (ownership / department scoping)
  if (resource) {
    return checkResourcePermission(user, action, resource);
  }

  return true;
}

/**
 * Checks whether a status transition is valid and allowed for a given user.
 */
export function canTransition(
  user: PermissionUser,
  fromStatus: ComplaintStatus,
  toStatus: ComplaintStatus,
  complaint: PermissionComplaint
): boolean {
  if (user.role === "ADMIN") {
    // Admin can always transition if it's a valid destination
    const validTargets = VALID_TRANSITIONS[fromStatus] ?? [];
    return validTargets.includes(toStatus);
  }

  const key = `${fromStatus}->${toStatus}` as `${ComplaintStatus}->${ComplaintStatus}`;
  const allowedRoles = TRANSITION_ROLES[key];
  if (!allowedRoles) return false;
  if (!allowedRoles.includes(user.role)) return false;

  // Scoping checks
  return checkResourcePermission(user, "complaint:update-status", complaint);
}

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

function checkResourcePermission(
  user: PermissionUser,
  action: Action,
  complaint: PermissionComplaint
): boolean {
  switch (user.role) {
    case "CITIZEN":
      // Citizens can only access their own complaints
      return complaint.citizenId === user.id;

    case "OFFICER":
      // Officers can only access complaints assigned to them
      // OR complaints in their department (for viewing)
      if (action === "complaint:view") {
        return (
          complaint.assignedOfficerId === user.id ||
          complaint.departmentId === user.departmentId
        );
      }
      // For mutations, must be the assigned officer
      return complaint.assignedOfficerId === user.id;

    case "DEPARTMENT_MANAGER":
      // Managers can access all complaints in their department
      return complaint.departmentId === user.departmentId;

    default:
      return false;
  }
}
