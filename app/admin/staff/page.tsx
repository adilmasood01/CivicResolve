import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getStaffOverview } from "@/services/admin.service";
import { getDepartmentsAdmin } from "@/services/department.service";
import StaffManagementClient from "./StaffManagementClient";

export const metadata: Metadata = {
  title: "Staff Roster — CivicResolve Admin",
};

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; search?: string }>;
}) {
  const adminUser = await requireRole("ADMIN");
  const params = await searchParams;

  const [staffList, departments] = await Promise.all([
    getStaffOverview(adminUser, {
      departmentId: params.departmentId,
      search: params.search,
    }),
    getDepartmentsAdmin(adminUser),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Roster & Officer Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor staff workloads, assign officers to departments, manage manager appointments, and view assigned complaint statistics.
          </p>
        </div>
      </div>

      <StaffManagementClient
        staffList={staffList}
        departments={departments}
        initialFilters={{
          departmentId: params.departmentId || "",
          search: params.search || "",
        }}
      />
    </div>
  );
}
