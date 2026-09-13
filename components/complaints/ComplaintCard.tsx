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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {complaint.complaintNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={complaint.priority} />
            <ComplaintStatusBadge status={complaint.status} />
          </div>
        </div>

        <h3 className="font-bold text-gray-900 text-base line-clamp-2">
          {complaint.title}
        </h3>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Category:</span>
            <span>{complaint.category.name}</span>
            <span className="text-gray-300">•</span>
            <span className="font-medium text-gray-700">Dept:</span>
            <span>{complaint.department.name}</span>
          </div>

          {complaint.location && (
            <div className="flex items-center gap-1 text-gray-600 truncate">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{complaint.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>Submitted on {formatDate(complaint.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3 mt-2 flex-wrap gap-2">
        {complaint.slaInfo ? (
          <SLABadge slaInfo={complaint.slaInfo} />
        ) : (
          <span />
        )}

        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition ml-auto"
        >
          <span>View Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
