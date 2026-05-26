"use server";

import prisma from "@/lib/prisma";
import { MaterialType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function saveMaterialToDb({
  title,
  url,
  type,
  courseId,
  folderId
}: {
  title: string;
  url: string;
  type: MaterialType;
  courseId: string;
  folderId?: string | null;
}) {
  try {
    const material = await prisma.material.create({
      data: {
        title,
        url,
        type,
        courseId,
        folderId: folderId || null,
      },
    });

    revalidatePath(`/courses/${courseId}`);

    // Notify enrolled users
    notifyEnrolledUsers(courseId, title, `/courses/${courseId}`);

    return { success: true, material };
  } catch (error) {
    console.error("Failed to save material to DB:", error);
    return { success: false, error: "Failed to record material in database" };
  }
}

// Validate YouTube URL format
function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

export async function saveYouTubeVideo({
  title,
  youtubeUrl,
  courseId,
  folderId
}: {
  title: string;
  youtubeUrl: string;
  courseId: string;
  folderId?: string | null;
}) {
  try {
    if (!isValidYouTubeUrl(youtubeUrl)) {
      return { success: false, error: "Invalid YouTube URL" };
    }

    const material = await prisma.material.create({
      data: {
        title,
        url: youtubeUrl,
        type: MaterialType.VIDEO,
        courseId,
        folderId: folderId || null,
      },
    });

    revalidatePath(`/courses/${courseId}`);

    // Notify enrolled users
    notifyEnrolledUsers(courseId, title, `/courses/${courseId}`);

    return { success: true, material };
  } catch (error) {
    console.error("Failed to save YouTube video:", error);
    return { success: false, error: "Failed to save video" };
  }
}

async function notifyEnrolledUsers(courseId: string, materialTitle: string, link: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { code: true },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: "new_material",
      title: "New Material Added",
      message: `"${materialTitle}" was added to ${course?.code || "a course"}`,
      link,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  } catch (error) {
    console.error("Failed to notify enrolled users:", error);
  }
}

