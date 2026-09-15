"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/admin";
import { EmptyState } from "@/components/layout";
import {
  Plus,
  Edit2,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderOpen,
  X,
} from "lucide-react";

interface CategoryManagementClientProps {
  categories: any[];
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
const textareaClass =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function CategoryManagementClient({
  categories,
  departments,
  initialFilters,
}: CategoryManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialFilters.search);
  const [departmentId, setDepartmentId] = useState(initialFilters.departmentId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formDeptId, setFormDeptId] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFormDeptId, setEditFormDeptId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    router.push(`/admin/categories?${params.toString()}`);
  };

  const handleOpenCreate = () => {
    setName("");
    setDescription("");
    setFormDeptId(departments[0]?.id || "");
    setErrorMsg(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditFormDeptId(cat.departmentId || "");
    setEditIsActive(cat.isActive);
    setErrorMsg(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("departmentId", formDeptId);

    startTransition(async () => {
      const res = await createCategoryAction(formData);
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
    if (!editCategory) return;
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("description", editDescription);
    formData.set("departmentId", editFormDeptId);
    if (editIsActive) formData.set("isActive", "true");

    startTransition(async () => {
      const res = await updateCategoryAction(editCategory.id, formData);
      if (res.success) {
        setEditCategory(null);
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
            placeholder="Search category by name…"
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
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title={hasFilters ? "No matching categories" : "No categories yet"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Create a category to start routing complaint types."
            }
            icon={<FolderOpen className="h-8 w-8" aria-hidden="true" />}
            action={
              !hasFilters ? (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Category
                </button>
              ) : undefined
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
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium">Routing Department</th>
                  <th className="px-3 py-2.5 font-medium">Complaints</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-foreground">{cat.name}</td>
                    <td className="max-w-xs truncate px-3 py-2.5 text-xs text-muted-foreground">
                      {cat.description || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {cat.department ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {cat.department.name}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({cat.department.code})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {cat._count.complaints}
                    </td>
                    <td className="px-3 py-2.5">
                      {cat.isActive ? (
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
                        onClick={() => handleOpenEdit(cat)}
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
              <h3 className="text-base font-semibold text-foreground">Create Category</h3>
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
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Street Lighting"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Routing Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
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
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of issues in this category…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClass}
                />
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setEditCategory(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Edit Category</h3>
              <button
                type="button"
                onClick={() => setEditCategory(null)}
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
                  Category Name
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
                  Routing Department
                </label>
                <select
                  value={editFormDeptId}
                  onChange={(e) => setEditFormDeptId(e.target.value)}
                  required
                  className={`${selectClass} w-full`}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
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
              <label className="flex items-center gap-2 pt-1 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                Active category
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
