import { prisma } from "@/lib/prisma";
import type { SessionUser, PaginatedResult } from "@/types";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  complaintId?: string;
  deduplicationKey?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, title, message, complaintId, deduplicationKey } = input;

  // Idempotency / Deduplication check
  if (deduplicationKey) {
    const existing = await prisma.notification.findUnique({
      where: { deduplicationKey },
    });
    if (existing) {
      return existing; // Already created — ignore duplicate
    }
  }

  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        complaintId: complaintId ?? null,
        deduplicationKey: deduplicationKey ?? null,
      },
    });
  } catch (error) {
    // If concurrent race condition on deduplication key, return existing safely
    if (deduplicationKey) {
      const existing = await prisma.notification.findUnique({
        where: { deduplicationKey },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function getUserNotifications(
  user: SessionUser,
  options?: { page?: number; pageSize?: number; unreadOnly?: boolean }
): Promise<PaginatedResult<any> & { unreadCount: number }> {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 15;
  const skip = (page - 1) * pageSize;

  const whereCondition: any = { userId: user.id };
  if (options?.unreadOnly) {
    whereCondition.isRead = false;
  }

  const [total, unreadCount, data] = await Promise.all([
    prisma.notification.count({ where: whereCondition }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.notification.findMany({
      where: whereCondition,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        complaint: {
          select: {
            id: true,
            complaintNumber: true,
            title: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    unreadCount,
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!userId) return 0;
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (!userId) throw new Error("Authentication required");

  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notif) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  if (!userId) throw new Error("Authentication required");

  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
