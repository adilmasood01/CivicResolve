import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getDepartmentsAdmin } from "@/services/department.service";
import { prisma } from "@/lib/prisma";
import DepartmentManagementClient from "./DepartmentManagementClient";

export const metadata: Metadata = {
  title: "Department Management — CivicResolve Admin",
};

export default async function AdminDepartmentsPage() {
  const adminUser = await requireRole("ADMIN");

  const [departments, potentialManagers] = await Promise.all([
    getDepartmentsAdmin(adminUser),
    prisma.user.findMany({
      where: {
        role: { in: ["DEPARTMENT_MANAGER", "OFFICER", "ADMIN"] },
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, departmentId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Department Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure municipal departments, assign department managers, manage staff rosters, and monitor department-level SLAs.
          </p>
        </div>
      </div>

      <DepartmentManagementClient
        departments={departments}
        potentialManagers={potentialManagers}
      />
    </div>
  );
}
