import { Priority } from "@prisma/client";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; fg: string; border: string }
> = {
  LOW: {
    label: "Low",
    bg: "bg-slate-100 dark:bg-slate-800",
    fg: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    fg: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  HIGH: {
    label: "High",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    fg: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50 dark:bg-red-950/40",
    fg: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    bg: "bg-gray-50",
    fg: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${config.bg} ${config.fg} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}
