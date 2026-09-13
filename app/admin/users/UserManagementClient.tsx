"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/app/actions/admin";
import type { SessionUser } from "@/types";
import { Role } from "@prisma/client";
import {
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
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

  // Modal State
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

  const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
    ADMIN: { label: "Administrator", bg: "bg-purple-100", text: "text-purple-800" },
    DEPARTMENT_MANAGER: { label: "Dept Manager", bg: "bg-blue-100", text: "text-blue-800" },
    OFFICER: { label: "Staff Officer", bg: "bg-indigo-100", text: "text-indigo-800" },
    CITIZEN: { label: "Citizen", bg: "bg-gray-100", text: "text-gray-700" },
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters(1)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="CITIZEN">Citizen</option>
            <option value="OFFICER">Staff Officer</option>
            <option value="DEPARTMENT_MANAGER">Dept Manager</option>
            <option value="ADMIN">Administrator</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => applyFilters(1)}
          className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Apply Filters</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {initialData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No users matching your filters.
                  </td>
                </tr>
              ) : (
                initialData.data.map((user) => {
                  const badge = roleBadges[user.role] || roleBadges.CITIZEN;
                  const isSelf = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{user.name || "No name"}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                                  YOU
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {user.department ? (
                          <span className="flex items-center gap-1 text-gray-800">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <span>{user.department.name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-gray-500 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(user)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSelf}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                            isSelf
                              ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                              : user.isActive
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {initialData.pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing page {initialData.pagination.page} of {initialData.pagination.totalPages} ({initialData.pagination.total} users)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={initialData.pagination.page <= 1}
                onClick={() => applyFilters(initialData.pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={initialData.pagination.page >= initialData.pagination.totalPages}
                onClick={() => applyFilters(initialData.pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Edit User Permissions</h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80">
              <p className="font-semibold text-gray-900 text-xs">{selectedUser.name || "No name"}</p>
              <p className="text-[11px] text-gray-500">{selectedUser.email}</p>
            </div>

            {selectedUser.id === currentUser.id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>You are editing your own account. Demoting or deactivating yourself is strictly blocked for security.</p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Role
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="CITIZEN">CITIZEN (Citizen User)</option>
                  <option value="OFFICER">OFFICER (Staff Officer)</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER (Manager)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              {(modalRole === "OFFICER" || modalRole === "DEPARTMENT_MANAGER") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assign Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-active-toggle"
                  checked={modalIsActive}
                  disabled={selectedUser.id === currentUser.id}
                  onChange={(e) => setModalIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="user-active-toggle" className="text-xs font-medium text-gray-800">
                  Account Enabled (Is Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
