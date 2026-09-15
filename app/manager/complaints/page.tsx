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
import { Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Department Complaints | CivicResolve Manager",
  description: "Oversee department complaints and assign officers.",
};

export default async function ManagerComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireRole("DEPARTMENT_MANAGER", "ADMIN");
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
            title="Department complaints"
            description="Assign officers, monitor SLA, and oversee cases in your department."
          />

          <ComplaintFilterBar />

          {complaints.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState
                title="No complaints found"
                description="There are no complaints matching your current filters."
                icon={<Building2 className="h-8 w-8" aria-hidden="true" />}
                compact
              />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ComplaintTable
                  complaints={complaints}
                  getDetailHref={(id) => `/manager/complaints/${id}`}
                  showOfficer
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
                {complaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    detailHref={`/manager/complaints/${c.id}`}
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
