"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin/analytics", label: "Overview", exact: true },
  { href: "/admin/analytics/departments", label: "Departments" },
  { href: "/admin/analytics/sla", label: "SLA" },
  { href: "/admin/analytics/officers", label: "Officers" },
];

export function AdminAnalyticsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto"
      aria-label="Analytics sections"
    >
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--cr-primary-muted)] text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
