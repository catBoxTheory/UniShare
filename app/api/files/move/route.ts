import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const { fileId, targetFolderId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Get the file to find its courseId
    const file = await prisma.material.findUnique({
      where: { id: fileId },
      select: { courseId: true },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // If targetFolderId is provided, verify it exists and belongs to the same course
    if (targetFolderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
        select: { courseId: true },
      });

      if (!folder) {
        return NextResponse.json({ error: "Target folder not found" }, { status: 404 });
      }

      if (folder.courseId !== file.courseId) {
        return NextResponse.json({ error: "Cannot move file to folder in different course" }, { status: 400 });
      }
    }

    // Update the file's folderId
    await prisma.material.update({
      where: { id: fileId },
      data: { folderId: targetFolderId || null },
    });

    revalidatePath(`/courses/${file.courseId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Move file error:", error);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}

