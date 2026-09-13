import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { getComplaints } from "@/services/complaint.service";
import { ComplaintFilterBar } from "@/components/complaints/ComplaintFilterBar";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
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

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  My Complaints
                </h1>
                <p className="text-sm text-gray-500">
                  Track the status and timeline of your submitted complaints.
                </p>
              </div>
            </div>

            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit New Complaint</span>
            </Link>
          </div>

          <ComplaintFilterBar />

          {complaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
              <p className="text-base font-semibold text-gray-800">No complaints found</p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                You haven&apos;t submitted any complaints matching the selected filters yet.
              </p>
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit a new complaint now</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaints.map((c) => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  detailHref={`/complaints/${c.id}`}
                />
              ))}
            </div>
          )}

          <Pagination meta={meta} />
        </div>
      </main>
    </div>
  );
}
