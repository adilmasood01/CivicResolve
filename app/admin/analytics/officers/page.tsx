import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminAnalyticsNav } from "@/components/admin/AdminAnalyticsNav";
import { PageHeader } from "@/components/layout";
import { getOfficerWorkload } from "@/services/analytics.service";

export const metadata: Metadata = {
  title: "Officer Workload Analytics | CivicResolve",
  description: "Operational workload, assignment count, and resolution performance across officers.",
};

export default async function OfficerWorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();

  if (!can(user, "analytics:view-system") && user.role !== "DEPARTMENT_MANAGER") {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          You don&apos;t have permission to view officer analytics.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const range = (typeof params.range === "string" ? params.range : "30d") as any;

  const data = await getOfficerWorkload(user, { range });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Officer Workload & Performance"
        description="Operational visibility into assigned caseloads, open items, breaches, and resolution times."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 text-xs font-medium">
            {["7d", "30d", "90d", "6m", "12m"].map((r) => (
              <Link
                key={r}
                href={`/admin/analytics/officers?range=${r}`}
                className={`rounded-md px-2.5 py-1.5 transition ${
                  range === r
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.toUpperCase()}
              </Link>
            ))}
          </div>
        }
      />

      {user.role === "ADMIN" && <AdminAnalyticsNav />}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Officer Caseload Breakdown ({data.length} Officers)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Officer</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned Complaints</th>
                <th className="px-4 py-3">Open</th>
                <th className="px-4 py-3">Resolved</th>
                <th className="px-4 py-3">Breached</th>
                <th className="px-4 py-3">Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {data.map((o) => (
                <tr key={o.officerId} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    <div>{o.officerName}</div>
                    <div className="text-xs font-normal text-muted-foreground">{o.officerEmail}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground">
                    {o.departmentName}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">{o.totalAssigned}</td>
                  <td className="px-4 py-3.5 font-medium text-amber-600">{o.openComplaints}</td>
                  <td className="px-4 py-3.5 font-medium text-emerald-600">{o.resolvedComplaints}</td>
                  <td className="px-4 py-3.5 font-semibold text-red-600">{o.breachedComplaints}</td>
                  <td className="px-4 py-3.5 font-medium text-foreground">{o.avgResolutionHours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
