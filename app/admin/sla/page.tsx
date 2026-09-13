import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getSLARulesAdmin } from "@/services/sla.service";
import SLAManagementClient from "./SLAManagementClient";

export const metadata: Metadata = {
  title: "SLA Rule Management — CivicResolve Admin",
};

export default async function AdminSLAPage() {
  const adminUser = await requireRole("ADMIN");
  const rules = await getSLARulesAdmin(adminUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SLA Rule Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure resolution targets and warning threshold triggers across complaint priority tiers.
          </p>
        </div>
      </div>

      <SLAManagementClient initialRules={rules} />
    </div>
  );
}
