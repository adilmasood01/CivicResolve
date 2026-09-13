"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDepartmentAction, updateDepartmentAction } from "@/app/actions/admin";
import {
  Building2,
  Plus,
  Edit2,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

interface DepartmentManagementClientProps {
  departments: any[];
  potentialManagers: any[];
}

export default function DepartmentManagementClient({
  departments,
  potentialManagers,
}: DepartmentManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<any | null>(null);

  // Create Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  // Edit Form State
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
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">
          Total Departments: <span className="font-bold text-gray-900">{departments.length}</span>
        </p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-blue-900/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`bg-white rounded-2xl border ${
              dept.isActive ? "border-gray-200" : "border-red-200 bg-red-50/10"
            } p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{dept.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] text-slate-700 font-bold">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {dept.description || "No description provided."}
                  </p>
                </div>

                {dept.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold">
                    <XCircle className="h-3 w-3" />
                    <span>Inactive</span>
                  </span>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="text-xs">
                  <p className="text-gray-400 text-[10px] font-semibold">DEPARTMENT MANAGER</p>
                  <p className="font-bold text-gray-800">
                    {dept.manager ? dept.manager.name : "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-center">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Officers</p>
                  <p className="text-xs font-bold text-gray-900">{dept._count.staff}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Open</p>
                  <p className="text-xs font-bold text-amber-600">{dept.stats.openComplaints}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Resolved</p>
                  <p className="text-xs font-bold text-emerald-600">{dept.stats.resolvedComplaints}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Breached</p>
                  <p className={`text-xs font-bold ${dept.stats.breachedSLAComplaints > 0 ? "text-red-600" : "text-gray-900"}`}>
                    {dept.stats.breachedSLAComplaints}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(dept)}
                className="w-full py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Configure Department</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Department Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Create Department</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environmental Health"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Code (Uppercase) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ENV"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Department Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Manager Assigned --</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
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
                  <span>Create Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Configure {editDept.name}</h3>
              <button type="button" onClick={() => setEditDept(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Manager
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Manager Assigned --</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dept-active-toggle"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="dept-active-toggle" className="text-xs font-medium text-gray-800">
                  Active Department (Deactivation preserves historical records)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
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
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
