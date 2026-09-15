import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getCategoriesAdmin } from "@/services/category.service";
import { getDepartmentsAdmin } from "@/services/department.service";
import { PageHeader } from "@/components/layout";
import CategoryManagementClient from "./CategoryManagementClient";

export const metadata: Metadata = {
  title: "Category Management — CivicResolve Admin",
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; search?: string }>;
}) {
  const adminUser = await requireRole("ADMIN");
  const params = await searchParams;

  const [categories, departments] = await Promise.all([
    getCategoriesAdmin(adminUser, {
      departmentId: params.departmentId,
      search: params.search,
    }),
    getDepartmentsAdmin(adminUser),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Configure complaint categories and route them to responsible departments."
      />

      <CategoryManagementClient
        categories={categories}
        departments={departments}
        initialFilters={{
          departmentId: params.departmentId || "",
          search: params.search || "",
        }}
      />
    </div>
  );
}
