import { ComplaintStatus } from "@prisma/client";

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; bg: string; fg: string; border: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    fg: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    fg: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    fg: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    fg: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    fg: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    fg: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    fg: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  REOPENED: {
    label: "Reopened",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    fg: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
};

export function ComplaintStatusBadge({ status, className = "" }: ComplaintStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-50",
    fg: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.bg} ${config.fg} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}
