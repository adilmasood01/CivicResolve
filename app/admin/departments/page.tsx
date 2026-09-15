import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getDepartmentsAdmin } from "@/services/department.service";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout";
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
      <PageHeader
        title="Department Management"
        description="Configure municipal departments, managers, and department-level workload."
      />

      <DepartmentManagementClient
        departments={departments}
        potentialManagers={potentialManagers}
      />
    </div>
  );
}
