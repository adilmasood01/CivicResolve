"use client";

import { useState, useTransition } from "react";
import { ComplaintStatus } from "@prisma/client";
import { updateStatusAction } from "@/app/actions/complaints";
import { STATUS_CONFIG } from "./ComplaintStatusBadge";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

const VALID_TRANSITIONS_MAP: Partial<Record<ComplaintStatus, ComplaintStatus[]>> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "UNDER_REVIEW"],
  IN_PROGRESS: ["RESOLVED", "UNDER_REVIEW"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"],
};

interface StatusTransitionControlProps {
  complaintId: string;
  currentStatus: ComplaintStatus;
  userRole: string;
}

export function StatusTransitionControl({
  complaintId,
  currentStatus,
  userRole: _userRole,
}: StatusTransitionControlProps) {
  const allowedTargets = VALID_TRANSITIONS_MAP[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | "">(
    ""
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  // Avoid empty status-actions shell when no transitions are available
  if (allowedTargets.length === 0) {
    return null;
  }

  const handleOpenModal = (status: ComplaintStatus) => {
    setSelectedStatus(status);
    setReason("");
    setError(null);
    setShowModal(true);
  };

  const handleConfirmTransition = () => {
    if (!selectedStatus) return;

    setError(null);
    startTransition(async () => {
      const res = await updateStatusAction(
        complaintId,
        selectedStatus as ComplaintStatus,
        reason
      );

      if (!res.success) {
        setError(res.error);
      } else {
        setShowModal(false);
        setSelectedStatus("");
      }
    });
  };

  return (
    <section className="mb-8 border-t border-border pt-6">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Status actions</h2>
      <div className="flex flex-wrap gap-2">
        {allowedTargets.map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => handleOpenModal(status)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Transition to {config?.label || status}
            </button>
          );
        })}
      </div>

      {showModal && selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                Update status to {STATUS_CONFIG[selectedStatus]?.label}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground">
                Reason / remarks (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Add context or notes for this status change..."
                className="w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
