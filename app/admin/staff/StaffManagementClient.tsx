"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/app/actions/admin";
import {
  UserCheck,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  ShieldCheck,
  ClipboardList,
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

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search officer or manager by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Filter Roster
          </button>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Staff Officer / Manager</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Assigned Department</th>
                <th className="px-5 py-3.5 text-center">Assigned Complaints</th>
                <th className="px-5 py-3.5 text-center">Open Complaints</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No staff matching your filters.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {staff.name?.charAt(0).toUpperCase() || staff.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{staff.name || "No name"}</p>
                          <p className="text-[11px] text-gray-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {staff.role === "DEPARTMENT_MANAGER" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Dept Manager</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                          <UserCheck className="h-3 w-3" />
                          <span>Staff Officer</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {staff.department ? (
                        <span className="flex items-center gap-1 text-gray-800">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span>{staff.department.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({staff.department.code})</span>
                        </span>
                      ) : (
                        <span className="text-red-500 italic font-semibold">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center font-bold text-gray-900">
                      {staff.assignedComplaintCount}
                    </td>

                    <td className="px-5 py-3.5 text-center font-bold text-amber-600">
                      {staff.openComplaintCount}
                    </td>

                    <td className="px-5 py-3.5">
                      {staff.isActive ? (
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

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(staff)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition font-semibold text-[11px] inline-flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3 text-blue-600" />
                        <span>Reassign</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Reassign Staff Assignment</h3>
              <button type="button" onClick={() => setEditStaff(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80">
              <p className="font-semibold text-gray-900 text-xs">{editStaff.name || "No name"}</p>
              <p className="text-[11px] text-gray-500">{editStaff.email}</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="OFFICER">OFFICER (Staff Officer)</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER (Manager)</option>
                  <option value="ADMIN">ADMIN (Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="staff-active-toggle"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="staff-active-toggle" className="text-xs font-medium text-gray-800">
                  Staff Account Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditStaff(null)}
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
                  <span>Save Roster Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
