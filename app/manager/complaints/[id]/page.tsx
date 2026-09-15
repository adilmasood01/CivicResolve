import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { getComplaintById } from "@/services/complaint.service";
import { ComplaintStatusBadge } from "@/components/complaints/ComplaintStatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { SLABadge } from "@/components/complaints/SLABadge";
import { ComplaintTimeline } from "@/components/complaints/ComplaintTimeline";
import { CommentSection } from "@/components/complaints/CommentSection";
import { AttachmentSection } from "@/components/attachments/AttachmentSection";
import { StatusTransitionControl } from "@/components/complaints/StatusTransitionControl";
import { AssignOfficerControl } from "@/components/complaints/AssignOfficerControl";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getSLAInfo } from "@/lib/sla";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manager Complaint Detail | CivicResolve`,
  };
}

export default async function ManagerComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("DEPARTMENT_MANAGER", "ADMIN");
  const { id } = await params;

  const complaint = await getComplaintById(user, id);

  if (!complaint) {
    notFound();
  }

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
        <PageContainer>
          <Link
            href="/manager/complaints"
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to department complaints
          </Link>

          <header className="mb-8 space-y-3 border-b border-border pb-5">
            <p className="font-mono text-sm font-medium text-primary">
              {complaint.complaintNumber}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {complaint.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <ComplaintStatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <SLABadge slaInfo={slaInfo} />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="min-w-0 space-y-0 lg:col-span-2">
              <Section title="Information">
                <div className="space-y-4 text-sm">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Category</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {complaint.category.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Department</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {complaint.department.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Submitted</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {formatDateTime(complaint.createdAt)}
                      </dd>
                    </div>
                    {slaInfo.deadline && (
                      <div>
                        <dt className="text-xs text-muted-foreground">SLA deadline</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {formatDate(slaInfo.deadline)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="border-t border-border pt-4">
                    <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                      Description
                    </h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                      {complaint.description}
                    </p>
                  </div>

                  {complaint.location && (
                    <div className="border-t border-border pt-4">
                      <h3 className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        Location
                      </h3>
                      <p className="font-medium text-foreground">{complaint.location}</p>
                      {complaint.latitude != null && complaint.longitude != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          GPS: {complaint.latitude}, {complaint.longitude}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Section>

              <StatusTransitionControl
                complaintId={complaint.id}
                currentStatus={complaint.status}
                userRole={user.role}
              />

              <Section title="Timeline">
                <ComplaintTimeline history={complaint.statusHistory} />
              </Section>

              <AttachmentSection
                complaintId={complaint.id}
                attachments={complaint.attachments as any}
                currentUser={user}
              />

              <CommentSection
                complaintId={complaint.id}
                comments={complaint.comments}
                currentUser={user}
              />
            </div>

            <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Operations</h2>
                <AssignOfficerControl
                  complaintId={complaint.id}
                  departmentId={complaint.departmentId}
                  assignedOfficer={complaint.assignedOfficer}
                />
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-foreground">Complainant</h2>
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {complaint.citizen.name || "N/A"}
                  </p>
                  <p className="text-muted-foreground">{complaint.citizen.email}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-foreground">SLA progress</h2>
                <SLABadge slaInfo={slaInfo} showProgress />
                {slaInfo.deadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline:{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(slaInfo.deadline)}
                    </span>
                  </p>
                )}
              </div>
            </aside>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
