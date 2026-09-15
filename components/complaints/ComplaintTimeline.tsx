import { formatDateTime } from "@/lib/utils";
import type { ComplaintStatusHistory } from "@prisma/client";
import type { SafeUser } from "@/types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { cn } from "@/lib/utils";

export interface TimelineEntry extends ComplaintStatusHistory {
  changedBy: SafeUser;
}

interface ComplaintTimelineProps {
  history: TimelineEntry[];
  className?: string;
}

export function ComplaintTimeline({ history, className = "" }: ComplaintTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No status history recorded yet.
      </p>
    );
  }

  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="space-y-0">
        {history.map((item, idx) => {
          const isLast = idx === history.length - 1;

          return (
            <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[7px] top-4 h-[calc(100%-0.5rem)] w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <div className="relative z-10 mt-1.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <ComplaintStatusBadge status={item.toStatus} />
                    <p className="text-xs text-muted-foreground">
                      by {item.changedBy?.name || item.changedBy?.email || "System"}
                      {item.changedBy?.role ? ` · ${item.changedBy.role.replace(/_/g, " ")}` : ""}
                    </p>
                  </div>
                  <time
                    className="whitespace-nowrap text-[11px] text-muted-foreground"
                    dateTime={new Date(item.createdAt).toISOString()}
                  >
                    {formatDateTime(item.createdAt)}
                  </time>
                </div>
                {item.reason ? (
                  <p className="mt-2 text-sm text-foreground">{item.reason}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
