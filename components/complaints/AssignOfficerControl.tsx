"use client";

import { useState, useEffect, useTransition } from "react";
import { assignOfficerAction } from "@/app/actions/complaints";
import type { SafeUser } from "@/types";
import { RefreshCw, AlertCircle } from "lucide-react";

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          Assigned officer
        </label>
        {isPending && (
          <RefreshCw
            className="h-3.5 w-3.5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading officers…</p>
      ) : (
        <select
          value={selectedId}
          onChange={(e) => handleAssign(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Unassigned —</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.name || officer.email} ({officer.email})
            </option>
          ))}
        </select>
      )}

      {assignedOfficer && (
        <p className="text-xs text-muted-foreground">
          Currently:{" "}
          <span className="font-medium text-foreground">
            {assignedOfficer.name || assignedOfficer.email}
          </span>
        </p>
      )}
    </div>
  );
}
