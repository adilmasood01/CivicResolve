import { ComplaintStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    className: "bg-muted text-muted-foreground border-border",
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-[var(--cr-info-bg)] text-[var(--cr-info)] border-[var(--cr-info)]/20",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-[var(--cr-info-bg)] text-[var(--cr-info)] border-[var(--cr-info)]/20",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-[var(--cr-info-bg)] text-[var(--cr-info)] border-[var(--cr-info)]/20",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-[var(--cr-success-bg)] text-[var(--cr-success)] border-[var(--cr-success)]/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[var(--cr-danger-bg)] text-[var(--cr-danger)] border-[var(--cr-danger)]/20",
  },
  REOPENED: {
    label: "Reopened",
    className: "bg-[var(--cr-warn-bg)] text-[var(--cr-warn)] border-[var(--cr-warn)]/25",
  },
};

export function ComplaintStatusBadge({ status, className = "" }: ComplaintStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
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
