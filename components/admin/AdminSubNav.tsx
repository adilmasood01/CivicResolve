"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderOpen,
  UserCheck,
  Timer,
  ScrollText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/staff", label: "Staff", icon: UserCheck },
  { href: "/admin/sla", label: "SLA rules", icon: Timer },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
] as const;

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[52px] z-30 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-11 items-center gap-4 overflow-x-auto">
          <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
            Admin
          </span>
          <nav className="flex items-center gap-0.5" aria-label="Admin center">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/admin/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-[var(--cr-primary-muted)] text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
