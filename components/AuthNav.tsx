"use client";

/**
 * CivicResolve — Authenticated Navigation Header
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  User,
  LogOut,
  Building2,
  Loader2,
  ChevronDown,
  CheckCheck,
  ArrowRight,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/types";
import { getDashboardPath } from "@/lib/auth";

interface AuthNavProps {
  user: SessionUser;
  unreadCount?: number;
}

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  OFFICER: "Officer",
  DEPARTMENT_MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "nav-badge-citizen",
  OFFICER: "nav-badge-officer",
  DEPARTMENT_MANAGER: "nav-badge-manager",
  ADMIN: "nav-badge-admin",
};

function getNavLinks(role: string): { href: string; label: string }[] {
  switch (role) {
    case "OFFICER":
      return [
        { href: "/staff/dashboard", label: "Dashboard" },
        { href: "/staff/complaints", label: "My cases" },
      ];
    case "DEPARTMENT_MANAGER":
      return [
        { href: "/manager/dashboard", label: "Dashboard" },
        { href: "/manager/complaints", label: "Complaints" },
        { href: "/manager/analytics", label: "Analytics" },
      ];
    case "ADMIN":
      return [{ href: "/admin/dashboard", label: "Overview" }];
    default:
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/complaints", label: "Complaints" },
      ];
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href.endsWith("/dashboard")) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function complaintHref(role: string, complaintId: string) {
  if (role === "CITIZEN") return `/complaints/${complaintId}`;
  if (role === "DEPARTMENT_MANAGER") return `/manager/complaints/${complaintId}`;
  if (role === "ADMIN") return `/staff/complaints/${complaintId}`;
  return `/staff/complaints/${complaintId}`;
}

export default function AuthNav({ user, unreadCount: initialUnread = 0 }: AuthNavProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnread);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch("/api/notifications?pageSize=5");
      const json = await res.json();
      if (res.ok && json.success) {
        setUnreadCount(json.unreadCount ?? 0);
        setRecentNotifs(json.data ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
    setNotifMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const dashboardPath = getDashboardPath(user.role);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleBadgeClass = ROLE_COLORS[user.role] ?? "nav-badge-citizen";
  const navLinks = getNavLinks(user.role);

  return (
    <header className="auth-nav">
      <div className="auth-nav-inner">
        <Link href={dashboardPath} className="auth-nav-brand">
          <Image
            src="/CivicResolve.jpg"
            alt="CivicResolve Logo"
            width={26}
            height={26}
            className="auth-nav-logo-img"
            priority
          />
          <span className="auth-nav-brand-name">CivicResolve</span>
        </Link>

        <nav className="auth-nav-links" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href)
                  ? "auth-nav-link auth-nav-link-active"
                  : "auth-nav-link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="auth-nav-right">
          <button
            type="button"
            className="auth-nav-icon-btn md:hidden"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => {
              setMobileNavOpen((v) => !v);
              setNotifMenuOpen(false);
              setUserMenuOpen(false);
            }}
          >
            {mobileNavOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              className="auth-nav-icon-btn relative"
              aria-label={`Notifications (${unreadCount} unread)`}
              onClick={() => {
                setNotifMenuOpen((v) => !v);
                setUserMenuOpen(false);
                setMobileNavOpen(false);
                if (!notifMenuOpen) fetchNotifications();
              }}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--cr-danger)] px-0.5 text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card text-xs shadow-lg sm:w-96">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <span className="font-medium text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 divide-y divide-border overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                      Loading…
                    </div>
                  ) : recentNotifs.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 ${!n.isRead ? "bg-[var(--cr-info-bg)]" : "hover:bg-muted/40"}`}
                      >
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.message}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.complaintId && (
                            <Link
                              href={complaintHref(user.role, n.complaintId)}
                              className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                              onClick={() => setNotifMenuOpen(false)}
                            >
                              View
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-border p-2 text-center">
                  <Link
                    href="/notifications"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    onClick={() => setNotifMenuOpen(false)}
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="auth-nav-user-menu relative">
            <button
              id="nav-user-menu-btn"
              type="button"
              className="auth-nav-user-btn"
              onClick={() => {
                setUserMenuOpen((v) => !v);
                setNotifMenuOpen(false);
                setMobileNavOpen(false);
              }}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <div className="auth-nav-avatar" aria-hidden="true">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="auth-nav-user-info">
                <span className="auth-nav-user-name">{user.name ?? user.email}</span>
                <span className={`auth-nav-badge ${roleBadgeClass}`}>{roleLabel}</span>
              </div>
              <ChevronDown
                className={`auth-nav-chevron ${userMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {userMenuOpen && (
              <div
                className="auth-nav-dropdown"
                role="menu"
                aria-labelledby="nav-user-menu-btn"
              >
                <div className="auth-nav-dropdown-header">
                  <p className="auth-nav-dropdown-name">{user.name ?? "User"}</p>
                  <p className="auth-nav-dropdown-email">{user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{roleLabel}</p>
                  {user.departmentId && (
                    <div className="auth-nav-dropdown-dept">
                      <Building2 className="h-3 w-3" aria-hidden="true" />
                      <span>Department assigned</span>
                    </div>
                  )}
                </div>
                <div className="auth-nav-dropdown-divider" />
                <Link
                  href="/profile"
                  className="auth-nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>Profile</span>
                </Link>
                <div className="auth-nav-dropdown-divider" />
                <button
                  id="nav-logout-btn"
                  type="button"
                  className="auth-nav-dropdown-item auth-nav-logout"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{isPending ? "Signing out…" : "Sign out"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <nav
          className="border-t border-border px-4 py-2 md:hidden"
          aria-label="Mobile primary"
        >
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(pathname, link.href)
                    ? "auth-nav-link auth-nav-link-active"
                    : "auth-nav-link"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
