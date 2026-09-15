"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, X, Bookmark, Download, FileText } from "lucide-react";
import { ComplaintStatus, Priority } from "@prisma/client";
import { PresetModal } from "./PresetModal";

interface ComplaintFilterBarProps {
  showDepartmentFilter?: boolean;
  departments?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  userRole?: string;
}

const selectClass =
  "h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

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
      // Non-critical
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
      params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`${pathname}?${createQueryString(name, value || null)}`);
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
    window.open(`/api/reports/complaints/csv?${searchParams.toString()}`, "_blank");
  };

  const handleExportPDF = () => {
    window.open(`/api/reports/complaints/pdf?${searchParams.toString()}`, "_blank");
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
    <div className="mb-5 space-y-3">
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search complaints…"
          aria-label="Search complaints"
          className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              handleFilterChange("search", "");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className={selectClass}
          aria-label="Status"
        >
          <option value="">Status</option>
          {Object.values(ComplaintStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("priority") || ""}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className={selectClass}
          aria-label="Priority"
        >
          <option value="">Priority</option>
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("slaStatus") || ""}
          onChange={(e) => handleFilterChange("slaStatus", e.target.value)}
          className={selectClass}
          aria-label="SLA status"
        >
          <option value="">SLA</option>
          <option value="ON_TRACK">On track</option>
          <option value="DUE_SOON">Due soon</option>
          <option value="BREACHED">Breached</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {categories.length > 0 && (
          <select
            value={searchParams.get("categoryId") || ""}
            onChange={(e) => handleFilterChange("categoryId", e.target.value)}
            className={selectClass}
            aria-label="Category"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {showDepartmentFilter && departments.length > 0 && (
          <select
            value={searchParams.get("departmentId") || ""}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            className={selectClass}
            aria-label="Department"
          >
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={searchParams.get("dateFrom") || ""}
          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          className={selectClass}
          aria-label="From date"
        />
        <input
          type="date"
          value={searchParams.get("dateTo") || ""}
          onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          className={selectClass}
          aria-label="To date"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <select
          onChange={(e) => {
            const p = presets.find((pr) => pr.id === e.target.value);
            if (p) applyPreset(p.filters);
            e.target.value = "";
          }}
          defaultValue=""
          className={selectClass}
          aria-label="Saved presets"
        >
          <option value="" disabled>
            {loadingPresets ? "Loading…" : "Presets"}
          </option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isShared ? " (shared)" : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
          Save
        </button>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      <PresetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePreset}
        isAdmin={userRole === "ADMIN"}
      />
    </div>
  );
}
