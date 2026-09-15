"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/layout";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  ScrollText,
  X,
} from "lucide-react";

interface AuditLogsClientProps {
  initialData: {
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  currentFilters: {
    search: string;
    action: string;
    entity: string;
    actorId: string;
    dateFrom: string;
    dateTo: string;
    page: number;
  };
}

const inputClass =
  "h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function AuditLogsClient({ initialData, currentFilters }: AuditLogsClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(currentFilters.search);
  const [action, setAction] = useState(currentFilters.action);
  const [entity, setEntity] = useState(currentFilters.entity);
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState(currentFilters.dateTo);

  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (newPage > 1) params.set("page", String(newPage));

    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const hasFilters = Boolean(
    currentFilters.search ||
      currentFilters.action ||
      currentFilters.entity ||
      currentFilters.dateFrom ||
      currentFilters.dateTo
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">Immutable audit trail</span>
          <span className="mx-1.5 text-border">·</span>
          Entries are read-only and cannot be altered or deleted.
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search action or entity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters(1)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass}>
            <option value="">All Actions</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="USER_DEPARTMENT_CHANGED">USER_DEPARTMENT_CHANGED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            <option value="DEPARTMENT_CREATED">DEPARTMENT_CREATED</option>
            <option value="DEPARTMENT_UPDATED">DEPARTMENT_UPDATED</option>
            <option value="CATEGORY_CREATED">CATEGORY_CREATED</option>
            <option value="CATEGORY_UPDATED">CATEGORY_UPDATED</option>
            <option value="SLA_RULE_CREATED">SLA_RULE_CREATED</option>
            <option value="SLA_RULE_UPDATED">SLA_RULE_UPDATED</option>
            <option value="SLA_BREACH_DETECTED">SLA_BREACH_DETECTED</option>
          </select>
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className={selectClass}>
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Department">Department</option>
            <option value="Category">Category</option>
            <option value="SLARule">SLARule</option>
            <option value="Complaint">Complaint</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClass}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => applyFilters(1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Filter className="h-3.5 w-3.5" />
            Apply Filters
          </button>
        </div>
      </div>

      {initialData.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title={hasFilters ? "No matching audit records" : "No audit records yet"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Administrative actions will appear here as they occur."
            }
            icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
            compact
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Timestamp</th>
                  <th className="px-3 py-2.5 font-medium">Actor</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                  <th className="px-3 py-2.5 font-medium">Entity</th>
                  <th className="px-3 py-2.5 font-medium">Entity ID</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialData.data.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      {log.actor ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {log.actor.name || log.actor.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{log.actor.role}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">System Engine</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">{log.entity}</td>
                    <td className="max-w-[120px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {log.entityId || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {initialData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">{initialData.pagination.page}</span> of{" "}
                <span className="font-medium text-foreground">
                  {initialData.pagination.totalPages}
                </span>
                <span className="hidden sm:inline"> · {initialData.pagination.total} total</span>
              </p>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={initialData.pagination.page <= 1}
                  onClick={() => applyFilters(initialData.pagination.page - 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Previous</span>
                </button>
                <button
                  type="button"
                  disabled={initialData.pagination.page >= initialData.pagination.totalPages}
                  onClick={() => applyFilters(initialData.pagination.page + 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <span className="sr-only sm:not-sr-only">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative z-10 w-full max-w-lg space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Audit Record</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Action
                </p>
                <p className="mt-0.5 font-mono font-medium text-foreground">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Timestamp
                </p>
                <p className="mt-0.5 font-mono text-foreground">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Entity
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {selectedLog.entity} ({selectedLog.entityId || "N/A"})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Actor
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {selectedLog.actor ? selectedLog.actor.email : "System"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-foreground">Metadata payload</p>
              <pre className="max-h-60 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] text-foreground">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
