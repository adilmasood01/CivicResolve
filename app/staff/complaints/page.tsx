import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { getComplaints } from "@/services/complaint.service";
import { ComplaintFilterBar } from "@/components/complaints/ComplaintFilterBar";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { Pagination } from "@/components/complaints/Pagination";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Officer Inbox | CivicResolve Staff",
  description: "Manage and resolve assigned complaints.",
};

export default async function OfficerComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireRole("OFFICER", "DEPARTMENT_MANAGER", "ADMIN");
  const params = await searchParams;

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? (params.status as any) : undefined,
    priority: typeof params.priority === "string" ? (params.priority as any) : undefined,
    categoryId: typeof params.categoryId === "string" ? params.categoryId : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    pageSize: 15,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  const { data: complaints, meta } = await getComplaints(user, filters);

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <PageContainer>
          <PageHeader
            title="Complaint inbox"
            description="Complaints assigned to you or in your department that need attention."
          />

          <ComplaintFilterBar />

          {complaints.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState
                title="No complaints found"
                description="There are no complaints matching your current filters."
                icon={<ClipboardList className="h-8 w-8" aria-hidden="true" />}
                compact
              />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ComplaintTable
                  complaints={complaints}
                  getDetailHref={(id) => `/staff/complaints/${id}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
                {complaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    detailHref={`/staff/complaints/${c.id}`}
                  />
                ))}
              </div>
            </>
          )}

          <Pagination meta={meta} />
        </PageContainer>
      </main>
    </div>
  );
}
