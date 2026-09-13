import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { getComplaintById } from "@/services/complaint.service";
import { ComplaintStatusBadge } from "@/components/complaints/ComplaintStatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { SLABadge } from "@/components/complaints/SLABadge";
import { ComplaintTimeline } from "@/components/complaints/ComplaintTimeline";
import { CommentSection } from "@/components/complaints/CommentSection";
import { AttachmentSection } from "@/components/attachments/AttachmentSection";
import { StatusTransitionControl } from "@/components/complaints/StatusTransitionControl";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getSLAInfo } from "@/lib/sla";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin, Calendar, Building2, Tag, User } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manage Complaint | CivicResolve Staff`,
  };
}

export default async function OfficerComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("OFFICER", "DEPARTMENT_MANAGER", "ADMIN");
  const { id } = await params;

  const complaint = await getComplaintById(user, id);

  if (!complaint) {
    notFound();
  }

  // Calculate live SLA status
  const slaRules = await prisma.sLARule.findMany({ where: { isActive: true } });
  const slaInfo = getSLAInfo(
    complaint.slaDeadline,
    complaint.status,
    slaRules,
    complaint.priority,
    complaint.createdAt
  );

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back link */}
          <div>
            <Link
              href="/staff/complaints"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Officer Inbox</span>
            </Link>
          </div>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {complaint.complaintNumber}
              </span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={complaint.priority} />
                <ComplaintStatusBadge status={complaint.status} />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {complaint.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold text-gray-800">Category:</span>
                <span>{complaint.category.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold text-gray-800">Department:</span>
                <span>{complaint.department.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold text-gray-800">Submitted:</span>
                <span>{formatDateTime(complaint.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description & Citizen Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-gray-900 text-base border-b pb-2">
                  Complaint Description
                </h3>
                <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                  {complaint.description}
                </p>

                {complaint.location && (
                  <div className="pt-4 border-t space-y-1">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      Location Details
                    </h4>
                    <p className="text-sm font-medium text-gray-900">{complaint.location}</p>
                    {complaint.latitude && complaint.longitude && (
                      <p className="text-xs text-gray-400">
                        GPS Coordinates: {complaint.latitude}, {complaint.longitude}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Action Controls */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <StatusTransitionControl
                  complaintId={complaint.id}
                  currentStatus={complaint.status}
                  userRole={user.role}
                />
              </div>

              {/* Attachments Section */}
              <AttachmentSection
                complaintId={complaint.id}
                attachments={complaint.attachments as any}
                currentUser={user}
              />

              {/* Comments & Internal Notes Thread */}
              <CommentSection
                complaintId={complaint.id}
                comments={complaint.comments}
                currentUser={user}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Citizen Details Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm border-b pb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Complainant Details</span>
                </h3>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-900">{complaint.citizen.name || "N/A"}</p>
                  <p className="text-gray-600">{complaint.citizen.email}</p>
                </div>
              </div>

              {/* SLA Status Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm border-b pb-2">
                  SLA Target
                </h3>
                <SLABadge slaInfo={slaInfo} showProgress />
                {slaInfo.deadline && (
                  <p className="text-xs text-gray-500">
                    Deadline: <strong className="text-gray-800">{formatDate(slaInfo.deadline)}</strong>
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm border-b pb-2">
                  Status History Timeline
                </h3>
                <ComplaintTimeline history={complaint.statusHistory} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
