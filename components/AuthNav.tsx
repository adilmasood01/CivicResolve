"use client";

/**
 * CivicResolve — Authenticated Navigation Header
 *
 * Displays user identity, role badge, department (if applicable),
 * notification center bell with unread count badge, profile link, and logout button.
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Building2,
  Loader2,
  ChevronDown,
  CheckCheck,
  ArrowRight,
  Clock,
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
  OFFICER: "Staff Officer",
  DEPARTMENT_MANAGER: "Dept. Manager",
  ADMIN: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "nav-badge-citizen",
  OFFICER: "nav-badge-officer",
  DEPARTMENT_MANAGER: "nav-badge-manager",
  ADMIN: "nav-badge-admin",
};

export default function AuthNav({ user, unreadCount: initialUnread = 0 }: AuthNavProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnread);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch unread count & recent notifications
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
      // Ignore network errors silently
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      // Ignore error
    }
  };

  const dashboardPath = getDashboardPath(user.role);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleBadgeClass = ROLE_COLORS[user.role] ?? "nav-badge-citizen";

  return (
    <header className="auth-nav">
      <div className="auth-nav-inner">
        {/* Brand */}
        <Link href={dashboardPath} className="auth-nav-brand">
          <ShieldCheck className="auth-nav-logo" aria-hidden="true" />
          <span className="auth-nav-brand-name">CivicResolve</span>
        </Link>

        {/* Right side */}
        <div className="auth-nav-right">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="auth-nav-icon-btn relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              aria-label={`Notifications (${unreadCount} unread)`}
              onClick={() => {
                setNotifMenuOpen((v) => !v);
                setUserMenuOpen(false);
              }}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden text-xs">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-blue-600" />
                      Loading notifications…
                    </div>
                  ) : recentNotifs.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      No notifications yet.
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 transition ${
                          !n.isRead ? "bg-blue-50/40 font-medium" : "hover:bg-gray-50"
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{n.title}</p>
                        <p className="text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {n.complaintId && (
                            <Link
                              href={
                                user.role === "CITIZEN"
                                  ? `/complaints/${n.complaintId}`
                                  : user.role === "DEPARTMENT_MANAGER"
                                  ? `/manager/complaints/${n.complaintId}`
                                  : `/staff/complaints/${n.complaintId}`
                              }
                              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                              onClick={() => setNotifMenuOpen(false)}
                            >
                              <span>View</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-gray-50 border-t text-center">
                  <Link
                    href="/notifications"
                    className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    onClick={() => setNotifMenuOpen(false)}
                  >
                    <span>View all notifications</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="auth-nav-user-menu relative">
            <button
              id="nav-user-menu-btn"
              className="auth-nav-user-btn"
              onClick={() => {
                setUserMenuOpen((v) => !v);
                setNotifMenuOpen(false);
              }}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              {/* Avatar */}
              <div className="auth-nav-avatar" aria-hidden="true">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>

              {/* Name + role */}
              <div className="auth-nav-user-info">
                <span className="auth-nav-user-name">
                  {user.name ?? user.email}
                </span>
                <span className={`auth-nav-badge ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
              </div>

              <ChevronDown
                className={`auth-nav-chevron ${userMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className="auth-nav-dropdown"
                role="menu"
                aria-labelledby="nav-user-menu-btn"
              >
                {/* User info header */}
                <div className="auth-nav-dropdown-header">
                  <p className="auth-nav-dropdown-name">
                    {user.name ?? "User"}
                  </p>
                  <p className="auth-nav-dropdown-email">{user.email}</p>
                  {user.departmentId && (
                    <div className="auth-nav-dropdown-dept">
                      <Building2 className="h-3 w-3" aria-hidden="true" />
                      <span>Department assigned</span>
                    </div>
                  )}
                </div>

                <div className="auth-nav-dropdown-divider" />

                {/* Profile link */}
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

                {/* Logout */}
                <button
                  id="nav-logout-btn"
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
    </header>
  );
}

