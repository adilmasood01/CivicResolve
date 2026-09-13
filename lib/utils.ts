import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ── Tailwind class merging (shadcn/ui standard) ───────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Complaint number generation ───────────────────────────────
/**
 * Generates a human-readable complaint number.
 * Format: CMP-{YEAR}-{6-digit-padded-sequence}
 * Example: CMP-2026-000001
 *
 * Note: The sequence number should come from your DB counter or
 * be derived from the total complaint count + 1 at creation time.
 */
export function generateComplaintNumber(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  const seq = String(sequence).padStart(6, "0");
  return `CMP-${y}-${seq}`;
}

// ── Date / time helpers ───────────────────────────────────────
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];

  for (const [interval, label] of intervals) {
    const count = Math.floor(seconds / interval);
    if (count >= 1) {
      return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

// ── String helpers ────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map(capitalize)
    .join(" ");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

// ── Number helpers ────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export const formatBytes = formatFileSize;

// ── Error helpers ─────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

// ── Pagination helpers ────────────────────────────────────────
export function getPaginationMeta(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ── URL helpers ───────────────────────────────────────────────
export function buildSearchParams(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}
