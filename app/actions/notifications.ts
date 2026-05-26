"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data: { read: true },
    });
  } catch (error) {
    console.error("Failed to mark notification read:", error);
  }
}

export async function markAllNotificationsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  } catch (error) {
    console.error("Failed to mark all read:", error);
  }
}

export async function getUnreadCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) return 0;

    return await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
  } catch {
    return 0;
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
