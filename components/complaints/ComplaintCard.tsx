import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SLABadge } from "./SLABadge";
import type { SLAInfo } from "@/lib/sla";
import type { ComplaintStatus, Priority } from "@prisma/client";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

export interface ComplaintCardData {
  id: string;
  complaintNumber: string;
  title: string;
  status: ComplaintStatus;
  priority: Priority;
  location?: string | null;
  createdAt: Date | string;
  category: { name: string };
  department: { name: string };
  assignedOfficer?: { name: string | null; email: string } | null;
  slaInfo?: SLAInfo;
}

interface ComplaintCardProps {
  complaint: ComplaintCardData;
  detailHref: string;
}

export function ComplaintCard({ complaint, detailHref }: ComplaintCardProps) {
  return (
    <article className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-medium text-primary">
            {complaint.complaintNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={complaint.priority} />
            <ComplaintStatusBadge status={complaint.status} />
          </div>
        </div>

        <h3 className="line-clamp-2 text-sm font-medium text-foreground">
          {complaint.title}
        </h3>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            {complaint.category.name}
            <span className="mx-1 text-border">·</span>
            {complaint.department.name}
          </p>

          {complaint.location && (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{complaint.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{formatDate(complaint.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {complaint.slaInfo ? <SLABadge slaInfo={complaint.slaInfo} /> : <span />}

        <Link
          href={detailHref}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
