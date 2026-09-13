import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { prisma } from "@/lib/prisma";
import ComplaintFormClient from "./ComplaintFormClient";
import { FilePlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Submit New Complaint | CivicResolve",
  description: "Submit a new public service complaint or issue.",
};

export default async function NewComplaintPage() {
  const user = await requireAuth();

  // Fetch active categories from DB for category select dropdown
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />

      <main className="dashboard-main">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <FilePlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Submit a New Complaint
              </h1>
              <p className="text-sm text-gray-500">
                Report a public service, infrastructure, or community issue.
              </p>
            </div>
          </div>

          <ComplaintFormClient categories={categories} />
        </div>
      </main>
    </div>
  );
}
