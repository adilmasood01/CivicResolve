"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
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

  return (
    <div className="space-y-4">
      {/* Read-Only Notice Banner */}
      <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-white">Immutable Security Audit Trail</span>
          <span className="text-slate-400 border-l border-slate-700 pl-2">
            Audit log entries are read-only and cannot be altered or deleted.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search action or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters(1)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          >
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

          {/* Entity Filter */}
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Department">Department</option>
            <option value="Category">Category</option>
            <option value="SLARule">SLARule</option>
            <option value="Complaint">Complaint</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => applyFilters(1)}
          className="w-full lg:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Apply Filters</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Entity ID</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {initialData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No audit records matching your query.
                  </td>
                </tr>
              ) : (
                initialData.data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {log.actor ? (
                        <div>
                          <p>{log.actor.name || log.actor.email}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{log.actor.role}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic font-normal">System Engine</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-gray-800 font-semibold">{log.entity}</td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500 max-w-[120px] truncate">
                      {log.entityId || "—"}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition font-semibold text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3 text-blue-600" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing page {initialData.pagination.page} of {initialData.pagination.totalPages} ({initialData.pagination.total} audit logs)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={initialData.pagination.page <= 1}
                onClick={() => applyFilters(initialData.pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={initialData.pagination.page >= initialData.pagination.totalPages}
                onClick={() => applyFilters(initialData.pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Audit Record Inspector</h3>
              <button type="button" onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">ACTION</p>
                  <p className="font-mono font-bold text-blue-700">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">TIMESTAMP</p>
                  <p className="font-mono text-gray-800">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">ENTITY</p>
                  <p className="font-bold text-gray-800">{selectedLog.entity} ({selectedLog.entityId || "N/A"})</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">ACTOR</p>
                  <p className="font-bold text-gray-800">{selectedLog.actor ? selectedLog.actor.email : "System"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-800 mb-1">Audit Event Metadata Payload</p>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
