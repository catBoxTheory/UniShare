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
    return { success: true, material };
  } catch (error) {
    console.error("Failed to save material to DB:", error);
    return { success: false, error: "Failed to record material in database" };
  }
}

