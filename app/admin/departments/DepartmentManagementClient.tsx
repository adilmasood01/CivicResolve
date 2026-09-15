"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDepartmentAction, updateDepartmentAction } from "@/app/actions/admin";
import { EmptyState } from "@/components/layout";
import {
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  X,
} from "lucide-react";

interface DepartmentManagementClientProps {
  departments: any[];
  potentialManagers: any[];
}

const inputClass =
  "h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const textareaClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function DepartmentManagementClient({
  departments,
  potentialManagers,
}: DepartmentManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setName("");
    setCode("");
    setDescription("");
    setManagerId("");
    setErrorMsg(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    setEditDept(dept);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditDescription(dept.description || "");
    setEditManagerId(dept.managerId || "");
    setEditIsActive(dept.isActive);
    setErrorMsg(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("code", code);
    formData.set("description", description);
    formData.set("managerId", managerId);

    startTransition(async () => {
      const res = await createDepartmentAction(formData);
      if (res.success) {
        setCreateModalOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("code", editCode);
    formData.set("description", editDescription);
    formData.set("managerId", editManagerId);
    if (editIsActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await updateDepartmentAction(editDept.id, formData);
      if (res.success) {
        setEditDept(null);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {departments.length} department{departments.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title="No departments yet"
            description="Create a department to start routing complaints and assigning staff."
            icon={<Building2 className="h-8 w-8" aria-hidden="true" />}
            action={
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New Department
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
                  <th className="px-3 py-2.5 font-medium">Department</th>
                  <th className="px-3 py-2.5 font-medium">Manager</th>
                  <th className="px-3 py-2.5 font-medium">Officers</th>
                  <th className="px-3 py-2.5 font-medium">Open</th>
                  <th className="px-3 py-2.5 font-medium">Resolved</th>
                  <th className="px-3 py-2.5 font-medium">Breached</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departments.map((dept) => (
                  <tr key={dept.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{dept.name}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                          {dept.code}
                        </span>
                      </div>
                      {dept.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                          {dept.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {dept.manager ? dept.manager.name : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {dept._count.staff}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-amber-600">
                      {dept.stats.openComplaints}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-emerald-600">
                      {dept.stats.resolvedComplaints}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-xs font-medium ${
                        dept.stats.breachedSLAComplaints > 0 ? "text-red-600" : "text-foreground"
                      }`}
                    >
                      {dept.stats.breachedSLAComplaints}
                    </td>
                    <td className="px-3 py-2.5">
                      {dept.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle className="h-3.5 w-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(dept)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setCreateModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Create Department</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
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

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environmental Health"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Department Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ENV"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of responsibilities…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Assign Department Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— No Manager Assigned —</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
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
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setEditDept(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Edit {editDept.name}</h3>
              <button
                type="button"
                onClick={() => setEditDept(null)}
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

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Assign Manager
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— No Manager Assigned —</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 pt-1 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                Active department
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
