"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function logMaterialView(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.materialView.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      create: {
        userId: session.user.id,
        materialId,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
      },
    });

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { courseId: true },
    });
    if (material) {
      revalidatePath(`/courses/${material.courseId}`);
    }
  } catch (error) {
    console.error("Failed to log material view:", error);
  }
}

export async function markCompleted(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await prisma.materialView.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      create: {
        userId: session.user.id,
        materialId,
        completed: true,
        viewedAt: new Date(),
      },
      update: {
        completed: true,
        viewedAt: new Date(),
      },
    });

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { courseId: true },
    });
    if (material) {
      revalidatePath(`/courses/${material.courseId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark completed:", error);
    return { success: false, error: "Failed to mark as completed" };
  }
}

export async function getCourseProgress(courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const totalMaterials = await prisma.material.count({
      where: { courseId },
    });

    const viewedCount = await prisma.materialView.count({
      where: {
        userId: session.user.id,
        material: { courseId },
      },
    });

    const completedCount = await prisma.materialView.count({
      where: {
        userId: session.user.id,
        material: { courseId },
        completed: true,
      },
    });

    return { total: totalMaterials, viewed: viewedCount, completed: completedCount };
  } catch (error) {
    console.error("Failed to get course progress:", error);
    return null;
  }
}
