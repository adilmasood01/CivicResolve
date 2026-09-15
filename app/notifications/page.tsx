import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
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
    <AppShell user={user} unreadCount={initialData.unreadCount} narrow>
      <NotificationCenterClient
        currentUser={user}
        initialData={initialData}
      />
    </AppShell>
  );
}
