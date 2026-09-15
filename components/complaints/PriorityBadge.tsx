import { Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-[var(--cr-info-bg)] text-[var(--cr-info)] border-[var(--cr-info)]/20",
  },
  HIGH: {
    label: "High",
    className: "bg-[var(--cr-warn-bg)] text-[var(--cr-warn)] border-[var(--cr-warn)]/25",
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-[var(--cr-danger-bg)] text-[var(--cr-danger)] border-[var(--cr-danger)]/20",
  },
};

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
