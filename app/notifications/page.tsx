import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { getUserNotifications } from "@/services/notification.service";
import NotificationCenterClient from "@/components/notifications/NotificationCenterClient";

export const metadata: Metadata = {
  title: "Notification Center | CivicResolve",
  description: "View and manage your CivicResolve notifications",
};

export default async function NotificationCenterPage() {
  const user = await requireAuth();
  const initialData = await getUserNotifications(user, { page: 1, pageSize: 20 });

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} unreadCount={initialData.unreadCount} />

      <main className="dashboard-main">
        <div className="max-w-4xl mx-auto space-y-6">
          <NotificationCenterClient
            currentUser={user}
            initialData={initialData}
          />
        </div>
      </main>
    </div>
  );
}
