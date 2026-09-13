import type { SLAInfo } from "@/lib/sla";
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

interface SLABadgeProps {
  slaInfo: SLAInfo;
  showProgress?: boolean;
  className?: string;
}

export function SLABadge({ slaInfo, showProgress = false, className = "" }: SLABadgeProps) {
  const { status, timeRemainingLabel, progressPercent } = slaInfo;

  let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let Icon = Clock;
  let labelText = timeRemainingLabel;

  if (status === "DUE_SOON") {
    badgeStyle = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
    Icon = AlertTriangle;
    labelText = `⚠ SLA Due Soon — ${timeRemainingLabel}`;
  } else if (status === "BREACHED") {
    badgeStyle = "bg-red-50 text-red-700 border-red-300 font-bold";
    Icon = ShieldAlert;
    labelText = `⚠ SLA Breached — ${timeRemainingLabel}`;
  } else if (status === "COMPLETED") {
    badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
    Icon = CheckCircle2;
    labelText = "Completed";
  }

  return (
    <div className={`inline-flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border ${badgeStyle}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{labelText}</span>
        </span>

        {showProgress && status !== "COMPLETED" && (
          <span className="text-[11px] font-medium text-gray-500 font-mono">
            {progressPercent}% elapsed
          </span>
        )}
      </div>

      {showProgress && status !== "COMPLETED" && (
        <div
          className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`SLA Progress ${progressPercent}%`}
        >
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              status === "BREACHED"
                ? "bg-red-600"
                : status === "DUE_SOON"
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
