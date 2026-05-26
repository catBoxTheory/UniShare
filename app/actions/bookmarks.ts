"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleBookmark(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const existing = await prisma.savedMaterial.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
    });

    if (existing) {
      await prisma.savedMaterial.delete({ where: { id: existing.id } });
      revalidatePath("/");
      return { success: true, saved: false };
    }

    await prisma.savedMaterial.create({
      data: { userId: session.user.id, materialId },
    });
    revalidatePath("/");
    return { success: true, saved: true };
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return { success: false, error: "Failed to toggle bookmark" };
  }
}

export async function isBookmarked(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const bookmark = await prisma.savedMaterial.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
    });
    return !!bookmark;
  } catch {
    return false;
  }
}

export async function getBookmarkedMaterials() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const bookmarks = await prisma.savedMaterial.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        material: {
          include: {
            course: { include: { department: true } },
          },
        },
      },
    });

    return bookmarks.map((b) => ({
      ...b.material,
      courseTitle: b.material.course.title,
      courseCode: b.material.course.code,
    }));
  } catch (error) {
    console.error("Failed to get bookmarked materials:", error);
    return [];
  }
}
