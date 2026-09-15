import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/utils";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SLABadge } from "./SLABadge";
import type { ComplaintCardData } from "./ComplaintCard";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";

interface ComplaintTableProps {
  complaints: ComplaintCardData[];
  getDetailHref: (id: string) => string;
  showOfficer?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function ComplaintTable({
  complaints,
  getDetailHref,
  showOfficer = false,
  emptyTitle = "No complaints found",
  emptyDescription = "There are no complaints matching your current filters.",
  emptyAction,
}: ComplaintTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          compact
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">Complaint</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              {showOfficer && <th className="px-3 py-2.5 font-medium">Officer</th>}
              <th className="px-3 py-2.5 font-medium">SLA</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
              <th className="px-3 py-2.5 text-right font-medium">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="max-w-xs px-3 py-2.5">
                  <p className="font-mono text-[11px] font-medium text-primary">
                    {c.complaintNumber}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.category.name}
                    <span className="mx-1 text-border">·</span>
                    {c.department.name}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <ComplaintStatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <PriorityBadge priority={c.priority} />
                </td>
                {showOfficer && (
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-foreground">
                    {c.assignedOfficer?.name || c.assignedOfficer?.email || (
                      <span className="italic text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                )}
                <td className="min-w-[8rem] px-3 py-2.5">
                  {c.slaInfo ? <SLABadge slaInfo={c.slaInfo} /> : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <Link
                    href={getDetailHref(c.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
