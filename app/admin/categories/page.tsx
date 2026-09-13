import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getCategoriesAdmin } from "@/services/category.service";
import { getDepartmentsAdmin } from "@/services/department.service";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Category Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure complaint categories and associate them with responsible municipal departments.
          </p>
        </div>
      </div>

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
