import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAdminUsers } from "@/services/user.service";
import { getDepartmentsAdmin } from "@/services/department.service";
import UserManagementClient from "./UserManagementClient";

export const metadata: Metadata = {
  title: "User Management — CivicResolve Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; departmentId?: string; page?: string }>;
}) {
  const adminUser = await requireRole("ADMIN");
  const params = await searchParams;

  const page = Number(params.page || 1);
  const search = params.search || "";
  const role = (params.role as any) || undefined;
  const departmentId = params.departmentId || undefined;

  const [usersData, departments] = await Promise.all([
    getAdminUsers(adminUser, { search, role, departmentId, page, pageSize: 15 }),
    getDepartmentsAdmin(adminUser),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage system users, change administrative roles, assign departments, and manage active status.
          </p>
        </div>
      </div>

      <UserManagementClient
        currentUser={adminUser}
        initialData={usersData}
        departments={departments}
        currentFilters={{ search, role, departmentId, page }}
      />
    </div>
  );
}
