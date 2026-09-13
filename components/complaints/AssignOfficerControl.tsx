"use client";

import { useState, useEffect, useTransition } from "react";
import { assignOfficerAction } from "@/app/actions/complaints";
import type { SafeUser } from "@/types";
import { UserCheck, RefreshCw, AlertCircle } from "lucide-react";

interface AssignOfficerControlProps {
  complaintId: string;
  departmentId: string;
  assignedOfficer: SafeUser | null;
}

export function AssignOfficerControl({
  complaintId,
  departmentId,
  assignedOfficer,
}: AssignOfficerControlProps) {
  const [officers, setOfficers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(assignedOfficer?.id || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchOfficers() {
      try {
        setLoading(true);
        const res = await fetch(`/api/departments/${departmentId}/officers`);
        const json = await res.json();
        if (json.success) {
          setOfficers(json.data);
        }
      } catch {
        setError("Failed to load department officers.");
      } finally {
        setLoading(false);
      }
    }

    fetchOfficers();
  }, [departmentId]);

  const handleAssign = (officerId: string) => {
    setSelectedId(officerId);
    setError(null);

    startTransition(async () => {
      const res = await assignOfficerAction(
        complaintId,
        officerId ? officerId : null
      );
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
          <UserCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>Assigned Officer</span>
        </label>
        {isPending && <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />}
      </div>

      {error && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-400">Loading officers...</div>
      ) : (
        <select
          value={selectedId}
          onChange={(e) => handleAssign(e.target.value)}
          disabled={isPending}
          className="w-full text-sm bg-white rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">-- Unassigned --</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.name || officer.email} ({officer.email})
            </option>
          ))}
        </select>
      )}

      {assignedOfficer && (
        <p className="text-xs text-gray-500">
          Currently assigned to:{" "}
          <strong className="text-gray-800">{assignedOfficer.name || assignedOfficer.email}</strong>
        </p>
      )}
    </div>
  );
}
