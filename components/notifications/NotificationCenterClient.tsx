"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  FileCheck,
  UserCheck,
  RotateCcw,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";

interface NotificationCenterClientProps {
  currentUser: SessionUser;
  initialData: {
    data: any[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    unreadCount: number;
  };
}

export default function NotificationCenterClient({
  currentUser,
  initialData,
}: NotificationCenterClientProps) {
  const [notifications, setNotifications] = useState<any[]>(initialData.data);
  const [unreadCount, setUnreadCount] = useState<number>(initialData.unreadCount);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [isPending, setIsPending] = useState(false);

  const filteredNotifs =
    activeTab === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleMarkAllRead = async () => {
    try {
      setIsPending(true);
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsPending(false);
    }
  };

  const handleMarkSingleRead = async (notificationId: string) => {
    try {
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.isRead) return;

      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore
    }
  };

  const getComplaintPath = (complaintId: string) => {
    switch (currentUser.role) {
      case "ADMIN":
      case "DEPARTMENT_MANAGER":
        return `/manager/complaints/${complaintId}`;
      case "OFFICER":
        return `/staff/complaints/${complaintId}`;
      case "CITIZEN":
      default:
        return `/complaints/${complaintId}`;
    }
  };

  const getTypeIcon = (type: string) => {
    const cls = "h-4 w-4 text-muted-foreground";
    switch (type) {
      case "SLA_WARNING":
        return <AlertTriangle className="h-4 w-4 text-[var(--cr-warn)]" />;
      case "SLA_BREACHED":
        return <ShieldAlert className="h-4 w-4 text-[var(--cr-danger)]" />;
      case "COMPLAINT_RESOLVED":
        return <CheckCircle2 className="h-4 w-4 text-[var(--cr-success)]" />;
      case "COMPLAINT_CLOSED":
        return <FileCheck className={cls} />;
      case "COMPLAINT_ASSIGNED":
        return <UserCheck className="h-4 w-4 text-primary" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="h-4 w-4 text-[var(--cr-info)]" />;
      case "COMPLAINT_REOPENED":
        return <RotateCcw className="h-4 w-4 text-[var(--cr-warn)]" />;
      default:
        return <Bell className={cls} />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Status changes, assignments, comments, and SLA alerts."
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Mark all as read
            </button>
          ) : null
        }
      />

      <div className="flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-3 pb-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "ALL"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("UNREAD")}
          className={`inline-flex items-center gap-1.5 px-3 pb-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "UNREAD"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread
          {unreadCount > 0 ? (
            <span className="tabular-nums text-[11px] text-muted-foreground">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      {filteredNotifs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title="No notifications"
            description={
              activeTab === "UNREAD"
                ? "You're caught up — no unread notifications."
                : "You have no notifications at this time."
            }
            icon={<Bell className="h-8 w-8" aria-hidden="true" />}
            compact
          />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {filteredNotifs.map((n) => (
            <li key={n.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleMarkSingleRead(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMarkSingleRead(n.id);
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 ${
                  !n.isRead ? "bg-primary/[0.03]" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0" aria-hidden="true">
                  {getTypeIcon(n.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      className={`text-sm ${
                        !n.isRead
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {!n.isRead ? (
                        <span
                          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle"
                          aria-label="Unread"
                        />
                      ) : null}
                      {n.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>

                  {n.complaint ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="font-mono text-[11px] text-primary">
                        {n.complaint.complaintNumber}
                      </span>
                      <Link
                        href={getComplaintPath(n.complaint.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View complaint
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
