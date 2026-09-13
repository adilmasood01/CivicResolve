"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, X, Filter, Bookmark, Download, FileText, Calendar, PlusCircle } from "lucide-react";
import { ComplaintStatus, Priority } from "@prisma/client";
import { PresetModal } from "./PresetModal";

interface ComplaintFilterBarProps {
  showDepartmentFilter?: boolean;
  departments?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  userRole?: string;
}

export function ComplaintFilterBar({
  showDepartmentFilter = false,
  departments = [],
  categories = [],
  userRole,
}: ComplaintFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [presets, setPresets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPresets, setLoadingPresets] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      setLoadingPresets(true);
      const res = await fetch("/api/presets");
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch {
      // Non-critical background fetch error
    } finally {
      setLoadingPresets(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "1"); // Reset to page 1 on filter change
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    const queryString = createQueryString(name, value || null);
    router.push(`${pathname}?${queryString}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", search);
  };

  const applyPreset = (presetFilters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(presetFilters).forEach(([key, val]) => {
      if (val) params.set(key, String(val));
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSavePreset = async (name: string, isShared: boolean) => {
    const currentFilters: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      if (key !== "page") currentFilters[key] = val;
    });

    const res = await fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters: currentFilters, isShared }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save preset");
    }

    await fetchPresets();
  };

  const clearAllFilters = () => {
    setSearch("");
    router.push(pathname);
  };

  const handleExportCSV = () => {
    const query = searchParams.toString();
    window.open(`/api/reports/complaints/csv?${query}`, "_blank");
  };

  const handleExportPDF = () => {
    const query = searchParams.toString();
    window.open(`/api/reports/complaints/pdf?${query}`, "_blank");
  };

  const hasActiveFilters =
    searchParams.has("search") ||
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("departmentId") ||
    searchParams.has("categoryId") ||
    searchParams.has("slaStatus") ||
    searchParams.has("dateFrom") ||
    searchParams.has("dateTo");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Advanced Search & Filters</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Selector */}
          <div className="relative">
            <select
              onChange={(e) => {
                const p = presets.find((pr) => pr.id === e.target.value);
                if (p) applyPreset(p.filters);
              }}
              defaultValue=""
              className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 outline-none focus:border-blue-500 font-medium text-gray-700"
            >
              <option value="" disabled>
                {loadingPresets ? "Loading presets..." : "Loaded Presets"}
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isShared ? "(Shared)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 transition"
          >
            <Bookmark className="h-3.5 w-3.5 text-blue-600" />
            <span>Save Preset</span>
          </button>

          {/* Export Actions */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, #, description, location..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                handleFilterChange("search", "");
              }}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Status Filter */}
        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.values(ComplaintStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={searchParams.get("priority") || ""}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* SLA Status Filter */}
        <select
          value={searchParams.get("slaStatus") || ""}
          onChange={(e) => handleFilterChange("slaStatus", e.target.value)}
          className="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">All SLA States</option>
          <option value="ON_TRACK">On Track</option>
          <option value="DUE_SOON">Due Soon</option>
          <option value="BREACHED">Breached</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={searchParams.get("categoryId") || ""}
            onChange={(e) => handleFilterChange("categoryId", e.target.value)}
            className="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Department Filter (Admin view) */}
        {showDepartmentFilter && departments.length > 0 && (
          <select
            value={searchParams.get("departmentId") || ""}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            className="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* Date From */}
        <div className="relative">
          <input
            type="date"
            value={searchParams.get("dateFrom") || ""}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="relative">
          <input
            type="date"
            value={searchParams.get("dateTo") || ""}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600 transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Active Filters</span>
          </button>
        </div>
      )}

      <PresetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePreset}
        isAdmin={userRole === "ADMIN"}
      />
    </div>
  );
}
