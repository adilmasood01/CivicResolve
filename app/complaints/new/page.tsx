import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import ComplaintFormClient from "./ComplaintFormClient";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Submit New Complaint | CivicResolve",
  description: "Submit a new public service complaint or issue.",
};

export default async function NewComplaintPage() {
  const user = await requireAuth();

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
        <PageContainer narrow>
          <Link
            href="/complaints"
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to complaints
          </Link>

          <PageHeader
            title="New complaint"
            description="Report a public service, infrastructure, or community issue."
          />

          <ComplaintFormClient categories={categories} />
        </PageContainer>
      </main>
    </div>
  );
}
