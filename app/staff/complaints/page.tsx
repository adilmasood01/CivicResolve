import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { getComplaints } from "@/services/complaint.service";
import { ComplaintFilterBar } from "@/components/complaints/ComplaintFilterBar";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Officer Complaint Inbox
                </h1>
                <p className="text-sm text-gray-500">
                  Complaints assigned to you or in your department requiring attention.
                </p>
              </div>
            </div>
          </div>

          <ComplaintFilterBar />

          <ComplaintTable
            complaints={complaints}
            getDetailHref={(id) => `/staff/complaints/${id}`}
          />

          <Pagination meta={meta} />
        </div>
      </main>
    </div>
  );
}
