import { Priority, ComplaintStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// SLA STATUS
// ─────────────────────────────────────────────────────────────

export type SLAStatus = "ON_TRACK" | "DUE_SOON" | "BREACHED" | "COMPLETED";

export interface SLAInfo {
  status: SLAStatus;
  deadline: Date | null;
  /** Milliseconds remaining (negative if breached) */
  msRemaining: number | null;
  /** Human-readable remaining time, e.g. "2 days 3 hours" */
  timeRemainingLabel: string;
  /** 0–100, representing elapsed % of total SLA window */
  progressPercent: number;
}

export interface SLARuleData {
  priority: Priority;
  resolutionHours: number;
  warningThresholdPercent: number;
}

// ─────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Calculates the SLA deadline for a complaint.
 * Call once at complaint creation time and persist to DB.
 */
export function calculateSLADeadline(
  priority: Priority,
  slaRules: SLARuleData[],
  fromDate: Date = new Date()
): Date | null {
  const rule = slaRules.find((r) => r.priority === priority);
  if (!rule) return null;

  const deadline = new Date(fromDate);
  deadline.setTime(deadline.getTime() + rule.resolutionHours * 60 * 60 * 1000);
  return deadline;
}

/**
 * Returns the full SLA status for a complaint.
 * Can be called on the server or in a server component.
 */
export function getSLAInfo(
  deadline: Date | null | undefined,
  status: ComplaintStatus,
  slaRules: SLARuleData[],
  priority: Priority,
  createdAt: Date
): SLAInfo {
  // Terminal statuses — SLA is no longer relevant in the usual sense
  if (
    status === "CLOSED" ||
    status === "RESOLVED" ||
    status === "REJECTED"
  ) {
    return {
      status: "COMPLETED",
      deadline: deadline ?? null,
      msRemaining: null,
      timeRemainingLabel: "Completed",
      progressPercent: 100,
    };
  }

  if (!deadline) {
    return {
      status: "ON_TRACK",
      deadline: null,
      msRemaining: null,
      timeRemainingLabel: "No deadline set",
      progressPercent: 0,
    };
  }

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();
  const rule = slaRules.find((r) => r.priority === priority);
  const totalMs = rule ? rule.resolutionHours * 60 * 60 * 1000 : 0;
  const elapsedMs = now.getTime() - createdAt.getTime();
  const progressPercent = totalMs > 0
    ? Math.min(100, Math.round((elapsedMs / totalMs) * 100))
    : 0;

  if (msRemaining <= 0) {
    return {
      status: "BREACHED",
      deadline,
      msRemaining,
      timeRemainingLabel: `Overdue by ${formatDuration(Math.abs(msRemaining))}`,
      progressPercent: 100,
    };
  }

  // Warning threshold: e.g. if 80% of SLA window has elapsed
  const warningThreshold = rule?.warningThresholdPercent ?? 80;
  const isDueSoon = progressPercent >= warningThreshold;

  return {
    status: isDueSoon ? "DUE_SOON" : "ON_TRACK",
    deadline,
    msRemaining,
    timeRemainingLabel: formatDuration(msRemaining) + " remaining",
    progressPercent,
  };
}

/**
 * Lightweight SLA status check (no full info needed).
 */
export function getSLAStatus(
  deadline: Date | null | undefined,
  status: ComplaintStatus
): SLAStatus {
  if (
    status === "CLOSED" ||
    status === "RESOLVED" ||
    status === "REJECTED"
  ) {
    return "COMPLETED";
  }
  if (!deadline) return "ON_TRACK";
  const now = new Date();
  if (deadline.getTime() <= now.getTime()) return "BREACHED";
  const msRemaining = deadline.getTime() - now.getTime();
  const totalMs = deadline.getTime(); // we don't have createdAt here, use simpler heuristic
  // Due soon: less than 20% of a 48-hour window (roughly 9.6 hours) as a safe default
  if (msRemaining < 9.6 * 60 * 60 * 1000) return "DUE_SOON";
  return "ON_TRACK";
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") : "< 1m";
}

/**
 * Default SLA hours per priority (used as fallback if DB rules unavailable).
 * Always prefer fetching rules from the database.
 */
export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  LOW: 240,      // 10 days
  MEDIUM: 120,   // 5 days
  HIGH: 48,      // 48 hours
  CRITICAL: 24,  // 24 hours
};
