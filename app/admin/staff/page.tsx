import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getStaffOverview } from "@/services/admin.service";
import { getDepartmentsAdmin } from "@/services/department.service";
import { PageHeader } from "@/components/layout";
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
      <PageHeader
        title="Staff Roster"
        description="Monitor officer workloads, department assignments, and manager appointments."
      />

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
