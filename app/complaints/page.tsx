import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { getComplaints } from "@/services/complaint.service";
import { ComplaintFilterBar } from "@/components/complaints/ComplaintFilterBar";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { Pagination } from "@/components/complaints/Pagination";
import { PlusCircle, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "My Complaints | CivicResolve",
  description: "View and track all complaints you have submitted.",
};

export default async function CitizenComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? (params.status as any) : undefined,
    priority: typeof params.priority === "string" ? (params.priority as any) : undefined,
    categoryId: typeof params.categoryId === "string" ? params.categoryId : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    pageSize: 12,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  const { data: complaints, meta } = await getComplaints(user, filters);
  const hasFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.categoryId
  );

  const emptyAction = (
    <Link
      href="/complaints/new"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <PlusCircle className="h-4 w-4" aria-hidden="true" />
      Submit a complaint
    </Link>
  );

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <PageContainer>
          <PageHeader
            title="Complaints"
            description="Track the status and timeline of complaints you have submitted."
            actions={
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                New complaint
              </Link>
            }
          />

          <ComplaintFilterBar />

          {complaints.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState
                title={hasFilters ? "No matching complaints" : "No complaints yet"}
                description={
                  hasFilters
                    ? "Try adjusting or clearing your filters to see more results."
                    : "When you submit a complaint, it will appear here with live status updates."
                }
                icon={<FileText className="h-8 w-8" aria-hidden="true" />}
                action={emptyAction}
              />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ComplaintTable
                  complaints={complaints}
                  getDetailHref={(id) => `/complaints/${id}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
                {complaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    detailHref={`/complaints/${c.id}`}
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
