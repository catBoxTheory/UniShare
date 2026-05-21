"use server";

import prisma from "@/lib/prisma";
import { deleteFileFromMinio } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function getFile(fileId: string) {
  try {
    const file = await prisma.material.findUnique({
      where: { id: fileId }
    });
    return file;
  } catch (error) {
    console.error("Failed to get file:", error);
    return null;
  }
}

export async function deleteFile(fileId: string) {
  try {
    // First get the file to find its URL and courseId
    const file = await prisma.material.findUnique({
      where: { id: fileId },
      select: { url: true, courseId: true }
    });

    if (!file) {
      return { success: false, error: "File not found" };
    }

    // Delete from MinIO storage
    try {
      await deleteFileFromMinio(file.url);
    } catch (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.material.delete({
      where: { id: fileId }
    });

    revalidatePath(`/courses/${file.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

export async function getRelatedFiles(courseId: string, currentFileId: string) {
    try {
        const file = await prisma.material.findUnique({
             where: { id: currentFileId },
             select: { folderId: true }
        });

        if (!file) return [];

        // Return files in the same folder
        return await prisma.material.findMany({
            where: {
                courseId,
                folderId: file.folderId,
                id: { not: currentFileId },
                type: 'VIDEO' // Only recommend videos
            }
        })
    } catch (error) {
        console.error("Failed to get related files:", error);
        return [];
    }
}

