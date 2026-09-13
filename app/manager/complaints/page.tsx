import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { getComplaints } from "@/services/complaint.service";
import { ComplaintFilterBar } from "@/components/complaints/ComplaintFilterBar";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Department Complaints Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage department complaints, assign staff officers, and monitor SLA compliance.
                </p>
              </div>
            </div>
          </div>

          <ComplaintFilterBar />

          <ComplaintTable
            complaints={complaints}
            getDetailHref={(id) => `/manager/complaints/${id}`}
            showOfficer
          />

          <Pagination meta={meta} />
        </div>
      </main>
    </div>
  );
}
