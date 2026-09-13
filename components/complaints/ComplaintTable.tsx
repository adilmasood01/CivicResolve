import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SLABadge } from "./SLABadge";
import type { ComplaintCardData } from "./ComplaintCard";
import { ExternalLink } from "lucide-react";

interface ComplaintTableProps {
  complaints: ComplaintCardData[];
  getDetailHref: (id: string) => string;
  showOfficer?: boolean;
}

export function ComplaintTable({
  complaints,
  getDetailHref,
  showOfficer = false,
}: ComplaintTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        No complaints found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Complaint #</th>
              <th className="py-3.5 px-4">Title & Category</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              {showOfficer && <th className="py-3.5 px-4">Assigned Officer</th>}
              <th className="py-3.5 px-4">SLA Deadline</th>
              <th className="py-3.5 px-4">Submitted</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-blue-50/40 transition">
                <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600 whitespace-nowrap">
                  {c.complaintNumber}
                </td>
                <td className="py-3.5 px-4 max-w-xs">
                  <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.category.name}</p>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {c.department.name}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={c.priority} />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <ComplaintStatusBadge status={c.status} />
                </td>
                {showOfficer && (
                  <td className="py-3.5 px-4 text-xs text-gray-700 whitespace-nowrap">
                    {c.assignedOfficer?.name || c.assignedOfficer?.email || (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                )}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {c.slaInfo ? <SLABadge slaInfo={c.slaInfo} /> : "—"}
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(c.createdAt)}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    href={getDetailHref(c.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3.5 w-3.5" />
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
