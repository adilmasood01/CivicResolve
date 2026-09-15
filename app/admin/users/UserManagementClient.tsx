"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/app/actions/admin";
import { EmptyState } from "@/components/layout";
import type { SessionUser } from "@/types";
import { Role } from "@prisma/client";
import {
  Search,
  Filter,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

interface UserManagementClientProps {
  currentUser: SessionUser;
  initialData: {
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  departments: any[];
  currentFilters: {
    search: string;
    role?: string;
    departmentId?: string;
    page: number;
  };
}

const inputClass =
  "h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const selectClass =
  "h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function UserManagementClient({
  currentUser,
  initialData,
  departments,
  currentFilters,
}: UserManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentFilters.search);
  const [role, setRole] = useState(currentFilters.role || "");
  const [departmentId, setDepartmentId] = useState(currentFilters.departmentId || "");

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalRole, setModalRole] = useState<Role>("CITIZEN");
  const [modalDeptId, setModalDeptId] = useState<string>("");
  const [modalIsActive, setModalIsActive] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (departmentId) params.set("departmentId", departmentId);
    if (newPage > 1) params.set("page", String(newPage));

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setModalRole(user.role);
    setModalDeptId(user.departmentId || "");
    setModalIsActive(user.isActive);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.set("role", modalRole);
    formData.set("departmentId", modalDeptId);
    if (modalIsActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await updateUserAction(selectedUser.id, formData);
      if (res.success) {
        setSuccessMessage("User permissions updated successfully.");
        setTimeout(() => setSelectedUser(null), 1200);
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleToggleStatus = (user: any) => {
    if (user.id === currentUser.id) {
      alert("Security restriction: You cannot deactivate your own admin account.");
      return;
    }

    const formData = new FormData();
    formData.set("role", user.role);
    formData.set("departmentId", user.departmentId || "");
    if (!user.isActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await updateUserAction(user.id, formData);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const roleBadges: Record<string, { label: string; className: string }> = {
    ADMIN: { label: "Administrator", className: "bg-violet-50 text-violet-800" },
    DEPARTMENT_MANAGER: { label: "Dept Manager", className: "bg-blue-50 text-blue-800" },
    OFFICER: { label: "Staff Officer", className: "bg-indigo-50 text-indigo-800" },
    CITIZEN: { label: "Citizen", className: "bg-muted text-muted-foreground" },
  };

  const hasFilters = Boolean(currentFilters.search || currentFilters.role || currentFilters.departmentId);

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
            onKeyDown={(e) => e.key === "Enter" && applyFilters(1)}
            className={`${inputClass} pl-8`}
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          <option value="">All Roles</option>
          <option value="CITIZEN">Citizen</option>
          <option value="OFFICER">Staff Officer</option>
          <option value="DEPARTMENT_MANAGER">Dept Manager</option>
          <option value="ADMIN">Administrator</option>
        </select>
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
          onClick={() => applyFilters(1)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Filter className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>

      {initialData.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title={hasFilters ? "No matching users" : "No users found"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Users will appear here once accounts exist."
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
                  <th className="px-3 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Department</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialData.data.map((user) => {
                  const badge = roleBadges[user.role] || roleBadges.CITIZEN;
                  const isSelf = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                              <span>{user.name || "No name"}</span>
                              {isSelf && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  YOU
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        {user.department ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.department.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {user.isActive ? (
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
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(user)}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSelf}
                            className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-medium transition ${
                              isSelf
                                ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                                : user.isActive
                                  ? "border-border text-red-700 hover:bg-red-50"
                                  : "border-border text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {initialData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">{initialData.pagination.page}</span> of{" "}
                <span className="font-medium text-foreground">
                  {initialData.pagination.totalPages}
                </span>
                <span className="hidden sm:inline"> · {initialData.pagination.total} total</span>
              </p>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={initialData.pagination.page <= 1}
                  onClick={() => applyFilters(initialData.pagination.page - 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Previous</span>
                </button>
                <button
                  type="button"
                  disabled={initialData.pagination.page >= initialData.pagination.totalPages}
                  onClick={() => applyFilters(initialData.pagination.page + 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <span className="sr-only sm:not-sr-only">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Edit User Permissions</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selectedUser.name || "No name"} · {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedUser.id === currentUser.id && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  You are editing your own account. Demoting or deactivating yourself is blocked for
                  security.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Assign Role</label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as Role)}
                  className={`${selectClass} w-full`}
                >
                  <option value="CITIZEN">CITIZEN (Citizen User)</option>
                  <option value="OFFICER">OFFICER (Staff Officer)</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER (Manager)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              {(modalRole === "OFFICER" || modalRole === "DEPARTMENT_MANAGER") && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Assign Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(e.target.value)}
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
              )}

              <label className="flex items-center gap-2 pt-1 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={modalIsActive}
                  disabled={selectedUser.id === currentUser.id}
                  onChange={(e) => setModalIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                Account enabled
              </label>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
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
