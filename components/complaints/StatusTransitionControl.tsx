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
  userRole,
}: StatusTransitionControlProps) {
  const allowedTargets = VALID_TRANSITIONS_MAP[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | "">(
    ""
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

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
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Status Actions
      </h4>
      <div className="flex flex-wrap gap-2">
        {allowedTargets.map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => handleOpenModal(status)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-700 shadow-sm transition"
            >
              <span>Transition to {config?.label || status}</span>
            </button>
          );
        })}
      </div>

      {showModal && selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg">
                Update Status to {STATUS_CONFIG[selectedStatus]?.label}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Reason / Remarks (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Add context or notes for this status change..."
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Confirm Status Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
