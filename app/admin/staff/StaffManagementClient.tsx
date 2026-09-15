"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/app/actions/admin";
import { EmptyState } from "@/components/layout";
import {
  UserCheck,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Role } from "@prisma/client";

interface StaffManagementClientProps {
  staffList: any[];
  departments: any[];
  initialFilters: {
    departmentId: string;
    search: string;
  };
}

const inputClass =
  "h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function StaffManagementClient({
  staffList,
  departments,
  initialFilters,
}: StaffManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialFilters.search);
  const [departmentId, setDepartmentId] = useState(initialFilters.departmentId);

  const [editStaff, setEditStaff] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<Role>("OFFICER");
  const [editDeptId, setEditDeptId] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    router.push(`/admin/staff?${params.toString()}`);
  };

  const handleOpenEdit = (staff: any) => {
    setEditStaff(staff);
    setEditRole(staff.role);
    setEditDeptId(staff.department?.id || "");
    setEditIsActive(staff.isActive);
    setErrorMsg(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("role", editRole);
    formData.set("departmentId", editDeptId);
    if (editIsActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await updateUserAction(editStaff.id, formData);
      if (res.success) {
        setEditStaff(null);
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const hasFilters = Boolean(initialFilters.search || initialFilters.departmentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className={`${inputClass} pl-8`}
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Filter
        </button>
      </div>

      {staffList.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title={hasFilters ? "No matching staff" : "No staff found"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Officers and managers will appear here once assigned."
            }
            icon={<Users className="h-8 w-8" aria-hidden="true" />}
            compact
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Staff</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Department</th>
                  <th className="px-3 py-2.5 font-medium">Assigned</th>
                  <th className="px-3 py-2.5 font-medium">Open</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                          {staff.name?.charAt(0).toUpperCase() || staff.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {staff.name || "No name"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {staff.role === "DEPARTMENT_MANAGER" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800">
                          <ShieldCheck className="h-3 w-3" />
                          Dept Manager
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                          <UserCheck className="h-3 w-3" />
                          Staff Officer
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {staff.department ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {staff.department.name}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({staff.department.code})
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium text-red-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {staff.assignedComplaintCount}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-amber-600">
                      {staff.openComplaintCount}
                    </td>
                    <td className="px-3 py-2.5">
                      {staff.isActive ? (
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
                        onClick={() => handleOpenEdit(staff)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        <Edit2 className="h-3 w-3" />
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setEditStaff(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Reassign Staff</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {editStaff.name || "No name"} · {editStaff.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditStaff(null)}
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
                <label className="mb-1 block text-xs font-medium text-foreground">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className={`${selectClass} w-full`}
                >
                  <option value="OFFICER">OFFICER (Staff Officer)</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER (Manager)</option>
                  <option value="ADMIN">ADMIN (Administrator)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  required
                  className={`${selectClass} w-full`}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
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
                Staff account active
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditStaff(null)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
