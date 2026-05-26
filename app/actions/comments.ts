"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createComment(materialId: string, content: string, parentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };
    if (!content.trim()) return { success: false, error: "Comment cannot be empty" };

    await prisma.comment.create({
      data: {
        userId: session.user.id,
        materialId,
        content: content.trim(),
        parentId: parentId || null,
      },
    });

    // Get the material's course to revalidate
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { courseId: true },
    });
    if (material) {
      revalidatePath(`/courses/${material.courseId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { success: false, error: "Comment not found" };
    if (comment.userId !== session.user.id) return { success: false, error: "Not authorized" };

    await prisma.comment.delete({ where: { id: commentId } });

    const material = await prisma.material.findUnique({
      where: { id: comment.materialId },
      select: { courseId: true },
    });
    if (material) {
      revalidatePath(`/courses/${material.courseId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function getComments(materialId: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const comments = await prisma.comment.findMany({
      where: { materialId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      isOwner: currentUserId === c.user.id,
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        isOwner: currentUserId === r.user.id,
      })),
    }));
  } catch (error) {
    console.error("Failed to get comments:", error);
    return [];
  }
}
