"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSLARuleAction } from "@/app/actions/admin";
import { Priority } from "@prisma/client";
import {
  Timer,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Clock,
  Plus,
} from "lucide-react";

interface SLAManagementClientProps {
  initialRules: any[];
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  LOW: { label: "LOW PRIORITY", bg: "bg-blue-100", text: "text-blue-800" },
  MEDIUM: { label: "MEDIUM PRIORITY", bg: "bg-emerald-100", text: "text-emerald-800" },
  HIGH: { label: "HIGH PRIORITY", bg: "bg-amber-100", text: "text-amber-800" },
  CRITICAL: { label: "CRITICAL PRIORITY", bg: "bg-red-100", text: "text-red-800" },
};

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
    <div className="space-y-6">
      {/* Immutability Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Historical SLA Integrity Notice</p>
          <p className="text-amber-800">
            Updating an SLA rule configuration applies to newly created complaints only. Existing complaint SLA deadlines (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">Complaint.slaDeadline</code>) will remain strictly unchanged to preserve historical compliance records.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">Configured Priority Rules ({initialRules.length})</p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-blue-900/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add / Update Priority Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {initialRules.map((rule) => {
          const badge = PRIORITY_BADGES[rule.priority] || PRIORITY_BADGES.LOW;

          return (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  {rule.isActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Disabled</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold">RESOLUTION TARGET</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{rule.resolutionHours} Hours</p>
                    <p className="text-[10px] text-gray-500">({Math.round(rule.resolutionHours / 24 * 10) / 10} days)</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold">WARNING TRIGGER</p>
                    <p className="text-xl font-bold text-amber-600 mt-0.5">At {rule.warningThresholdPercent || 80}%</p>
                    <p className="text-[10px] text-gray-500">Elapsed SLA Window</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rule)}
                  className="w-full py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Configure Rule</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Rule Modal */}
      {editRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editRule.isNew ? "Configure Priority Rule" : `Edit SLA Rule — ${editRule.priority}`}
              </h3>
              <button type="button" onClick={() => setEditRule(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Priority Tier
                </label>
                <select
                  value={priority}
                  disabled={!editRule.isNew}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resolution SLA Duration (Hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={2000}
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Duration must be greater than 0 hours.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Warning Threshold (% of SLA Elapsed)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={99}
                  value={warningThresholdPercent}
                  onChange={(e) => setWarningThresholdPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Trigger SLA warning notifications when this percentage of time has passed.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sla-active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sla-active-toggle" className="text-xs font-medium text-gray-800">
                  Active Rule
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditRule(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-900/20"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save SLA Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
