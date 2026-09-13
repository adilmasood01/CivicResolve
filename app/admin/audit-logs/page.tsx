import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAuditLogs } from "@/services/audit.service";
import AuditLogsClient from "./AuditLogsClient";

export const metadata: Metadata = {
  title: "Audit Log Viewer — CivicResolve Admin",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    action?: string;
    entity?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  const adminUser = await requireRole("ADMIN");
  const params = await searchParams;

  const page = Number(params.page || 1);
  const search = params.search || undefined;
  const action = params.action || undefined;
  const entity = params.entity || undefined;
  const actorId = params.actorId || undefined;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;

  const logsData = await getAuditLogs(adminUser, {
    search,
    action,
    entity,
    actorId,
    dateFrom,
    dateTo,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Audit Log Viewer</h1>
          <p className="text-xs text-gray-500 mt-1">
            Read-only immutable trail of administrative operations, security changes, and system events.
          </p>
        </div>
      </div>

      <AuditLogsClient
        initialData={logsData}
        currentFilters={{
          search: search || "",
          action: action || "",
          entity: entity || "",
          actorId: actorId || "",
          dateFrom: dateFrom || "",
          dateTo: dateTo || "",
          page,
        }}
      />
    </div>
  );
}
