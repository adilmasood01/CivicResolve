import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getSLARulesAdmin } from "@/services/sla.service";
import { PageHeader } from "@/components/layout";
import SLAManagementClient from "./SLAManagementClient";

export const metadata: Metadata = {
  title: "SLA Rule Management — CivicResolve Admin",
};

export default async function AdminSLAPage() {
  const adminUser = await requireRole("ADMIN");
  const rules = await getSLARulesAdmin(adminUser);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Rule Management"
        description="Configure resolution targets and warning thresholds by complaint priority."
      />

      <SLAManagementClient initialRules={rules} />
    </div>
  );
}
