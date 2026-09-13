import { formatDateTime } from "@/lib/utils";
import type { ComplaintStatusHistory } from "@prisma/client";
import type { SafeUser } from "@/types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";

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
      <div className="text-sm text-gray-500 py-4 text-center">
        No status history recorded yet.
      </div>
    );
  }

  return (
    <div className={`flow-root ${className}`}>
      <ul role="list" className="-mb-8">
        {history.map((item, idx) => {
          const isLast = idx === history.length - 1;

          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center ring-8 ring-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ComplaintStatusBadge status={item.toStatus} />
                        <span className="text-xs text-gray-500 font-medium">
                          by {item.changedBy?.name || item.changedBy?.email || "System"} ({item.changedBy?.role})
                        </span>
                      </div>
                      {item.reason && (
                        <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded p-2 border border-gray-100">
                          {item.reason}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                      <time dateTime={new Date(item.createdAt).toISOString()}>
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
