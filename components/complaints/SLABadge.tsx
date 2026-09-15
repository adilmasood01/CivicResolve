import type { SLAInfo } from "@/lib/sla";
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLABadgeProps {
  slaInfo: SLAInfo;
  showProgress?: boolean;
  className?: string;
}

export function SLABadge({ slaInfo, showProgress = false, className = "" }: SLABadgeProps) {
  const { status, timeRemainingLabel, progressPercent } = slaInfo;

  let badgeStyle = "bg-[var(--cr-success-bg)] text-[var(--cr-success)] border-[var(--cr-success)]/20";
  let Icon = Clock;
  let labelText = timeRemainingLabel;

  if (status === "DUE_SOON") {
    badgeStyle = "bg-[var(--cr-warn-bg)] text-[var(--cr-warn)] border-[var(--cr-warn)]/25";
    Icon = AlertTriangle;
    labelText = `Due soon — ${timeRemainingLabel}`;
  } else if (status === "BREACHED") {
    badgeStyle = "bg-[var(--cr-danger-bg)] text-[var(--cr-danger)] border-[var(--cr-danger)]/20";
    Icon = ShieldAlert;
    labelText = `Breached — ${timeRemainingLabel}`;
  } else if (status === "COMPLETED") {
    badgeStyle = "bg-muted text-muted-foreground border-border";
    Icon = CheckCircle2;
    labelText = "Completed";
  }

  return (
    <div className={cn("inline-flex w-full flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium",
            badgeStyle
          )}
        >
          <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{labelText}</span>
        </span>

        {showProgress && status !== "COMPLETED" && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {progressPercent}%
          </span>
        )}
      </div>

      {showProgress && status !== "COMPLETED" && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`SLA Progress ${progressPercent}%`}
        >
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              status === "BREACHED"
                ? "bg-[var(--cr-danger)]"
                : status === "DUE_SOON"
                  ? "bg-[var(--cr-warn)]"
                  : "bg-[var(--cr-success)]"
            )}
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
