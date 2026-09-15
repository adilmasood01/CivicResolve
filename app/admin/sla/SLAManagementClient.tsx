"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSLARuleAction } from "@/app/actions/admin";
import { EmptyState } from "@/components/layout";
import { Priority } from "@prisma/client";
import {
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  Plus,
  Timer,
  X,
} from "lucide-react";

interface SLAManagementClientProps {
  initialRules: any[];
}

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  LOW: { label: "LOW", className: "bg-blue-50 text-blue-800" },
  MEDIUM: { label: "MEDIUM", className: "bg-emerald-50 text-emerald-800" },
  HIGH: { label: "HIGH", className: "bg-amber-50 text-amber-800" },
  CRITICAL: { label: "CRITICAL", className: "bg-red-50 text-red-800" },
};

const inputClass =
  "h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function SLAManagementClient({ initialRules }: SLAManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editRule, setEditRule] = useState<any | null>(null);
  const [priority, setPriority] = useState<Priority>("LOW");
  const [resolutionHours, setResolutionHours] = useState<number>(48);
  const [warningThresholdPercent, setWarningThresholdPercent] = useState<number>(80);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenEdit = (rule: any) => {
    setEditRule(rule);
    setPriority(rule.priority);
    setResolutionHours(rule.resolutionHours);
    setWarningThresholdPercent(rule.warningThresholdPercent || 80);
    setIsActive(rule.isActive);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setEditRule({ isNew: true });
    setPriority("LOW");
    setResolutionHours(48);
    setWarningThresholdPercent(80);
    setIsActive(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("priority", priority);
    formData.set("resolutionHours", String(resolutionHours));
    formData.set("warningThresholdPercent", String(warningThresholdPercent));
    if (isActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await saveSLARuleAction(formData);
      if (res.success) {
        setEditRule(null);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-0.5">
          <p className="font-medium">Historical SLA integrity</p>
          <p className="text-amber-800">
            Rule updates apply to newly created complaints only. Existing{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px]">
              Complaint.slaDeadline
            </code>{" "}
            values stay unchanged.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {initialRules.length} priority rule{initialRules.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add / Update Rule
        </button>
      </div>

      {initialRules.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title="No SLA rules configured"
            description="Add a priority rule to define resolution targets and warning thresholds."
            icon={<Timer className="h-8 w-8" aria-hidden="true" />}
            action={
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </button>
            }
            compact
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Priority</th>
                  <th className="px-3 py-2.5 font-medium">Resolution Target</th>
                  <th className="px-3 py-2.5 font-medium">Warning Trigger</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialRules.map((rule) => {
                  const badge = PRIORITY_BADGES[rule.priority] || PRIORITY_BADGES.LOW;
                  return (
                    <tr key={rule.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-medium text-foreground">
                          {rule.resolutionHours} hrs
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          ({Math.round((rule.resolutionHours / 24) * 10) / 10} days)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-amber-700">
                        At {rule.warningThresholdPercent || 80}% elapsed
                      </td>
                      <td className="px-3 py-2.5">
                        {rule.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rule)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setEditRule(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                {editRule.isNew ? "Configure Priority Rule" : `Edit SLA Rule — ${editRule.priority}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditRule(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Priority Tier
                </label>
                <select
                  value={priority}
                  disabled={!editRule.isNew}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={selectClass}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Resolution SLA Duration (Hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={2000}
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(Number(e.target.value))}
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Duration must be greater than 0 hours.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Warning Threshold (% of SLA Elapsed)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={99}
                  value={warningThresholdPercent}
                  onChange={(e) => setWarningThresholdPercent(Number(e.target.value))}
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Trigger warning notifications when this percentage of time has passed.
                </p>
              </div>
              <label className="flex items-center gap-2 pt-1 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                Active rule
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditRule(null)}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
