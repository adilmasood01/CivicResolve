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
    switch (type) {
      case "SLA_WARNING":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "SLA_BREACHED":
        return <ShieldAlert className="h-5 w-5 text-red-600" />;
      case "COMPLAINT_RESOLVED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "COMPLAINT_CLOSED":
        return <FileCheck className="h-5 w-5 text-gray-600" />;
      case "COMPLAINT_ASSIGNED":
        return <UserCheck className="h-5 w-5 text-purple-600" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case "COMPLAINT_REOPENED":
        return <RotateCcw className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              Notification Center
            </h1>
            <p className="text-xs text-gray-500">
              Stay updated on status changes, assignments, comments, and SLA alerts.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-xs transition disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center border-b border-gray-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === "ALL"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("UNREAD")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === "UNREAD"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-2">
          <Bell className="h-10 w-10 mx-auto text-gray-300" />
          <p className="font-semibold text-gray-700">No notifications found</p>
          <p className="text-xs">
            {activeTab === "UNREAD"
              ? "You've caught up on all your notifications!"
              : "You have no notifications at this time."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingleRead(n.id)}
              className={`p-4 rounded-2xl border transition flex items-start gap-4 ${
                !n.isRead
                  ? "bg-blue-50/50 border-blue-200 shadow-xs"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-xs shrink-0 mt-0.5">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>

                {n.complaint && (
                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {n.complaint.complaintNumber}
                    </span>

                    <Link
                      href={getComplaintPath(n.complaint.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      <span>View Complaint Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
