"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rateMaterial(materialId: string, rating: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }

  try {
    await prisma.materialRating.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      create: {
        userId: session.user.id,
        materialId,
        rating,
      },
      update: {
        rating,
      },
    });

    const aggregate = await prisma.materialRating.aggregate({
      where: { materialId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    revalidatePath("/");

    return {
      success: true,
      data: {
        avgRating: Math.round((aggregate._avg.rating || 0) * 10) / 10,
        totalRatings: aggregate._count.rating,
      },
    };
  } catch (error) {
    console.error("Failed to rate material:", error);
    return { success: false, error: "Failed to save rating" };
  }
}

export async function getUserRating(materialId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const rating = await prisma.materialRating.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      select: { rating: true },
    });
    return rating?.rating || null;
  } catch (error) {
    console.error("Failed to get user rating:", error);
    return null;
  }
}
