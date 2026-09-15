"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types";

interface PaginationProps {
  meta: PaginationMeta;
}

export function Pagination({ meta }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (meta.totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{meta.page}</span> of{" "}
        <span className="font-medium text-foreground">{meta.totalPages}</span>
        <span className="hidden sm:inline"> · {meta.total} total</span>
      </p>
      <nav className="inline-flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => handlePageChange(meta.page - 1)}
          disabled={!meta.hasPreviousPage}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </button>
        <button
          type="button"
          onClick={() => handlePageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
