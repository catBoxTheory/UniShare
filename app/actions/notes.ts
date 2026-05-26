"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveNote(materialId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await prisma.materialNote.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      create: {
        userId: session.user.id,
        materialId,
        content,
      },
      update: {
        content,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save note:", error);
    return { success: false, error: "Failed to save note" };
  }
}

export async function getNote(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const note = await prisma.materialNote.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
    });

    return note ? { content: note.content, updatedAt: note.updatedAt.toISOString() } : null;
  } catch (error) {
    console.error("Failed to get note:", error);
    return null;
  }
}

export async function deleteNote(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await prisma.materialNote.deleteMany({
      where: { userId: session.user.id, materialId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false, error: "Failed to delete note" };
  }
}
