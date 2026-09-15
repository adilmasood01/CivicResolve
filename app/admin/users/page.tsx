import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAdminUsers } from "@/services/user.service";
import { getDepartmentsAdmin } from "@/services/department.service";
import { PageHeader } from "@/components/layout";
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
      <PageHeader
        title="User Management"
        description="Manage system users, roles, department assignments, and account status."
      />

      <UserManagementClient
        currentUser={adminUser}
        initialData={usersData}
        departments={departments}
        currentFilters={{ search, role, departmentId, page }}
      />
    </div>
  );
}
