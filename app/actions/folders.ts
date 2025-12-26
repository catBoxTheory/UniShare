"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string, courseId: string, parentId?: string) {
  try {
    const folder = await prisma.folder.create({
      data: {
        name,
        courseId,
        parentId: parentId || null,
      },
    });
    
    revalidatePath(`/courses/${courseId}`);
    return { success: true, data: folder };
  } catch (error) {
    console.error("Failed to create folder:", error);
    return { success: false, error: "Failed to create folder" };
  }
}

export async function getFolderContents(courseId: string, folderId?: string) {
  try {
    // If no folderId provided, find the root folder(s) for the course
    // Or folders with NO parentId if we treat null as root
    const whereCondition = folderId 
      ? { parentId: folderId, courseId } 
      : { parentId: null, courseId };

    const folders = await prisma.folder.findMany({
      where: {
        ...whereCondition,
        NOT: {
          name: "Root"
        }
      },
      orderBy: { name: "asc" },
    });

    const files = await prisma.material.findMany({
      where: {
        courseId,
        folderId: folderId || null,
      },
      orderBy: { title: "asc" },
    });

    return { folders, files };
  } catch (error) {
    console.error("Failed to fetch contents:", error);
    return { folders: [], files: [] };
  }
}

export async function getFolderPath(folderId: string) {
  // Recursively fetch parents to build breadcrumbs
  // For simplicity in this first pass, we might just fetch the single folder
  // A proper recursive CTE is better for deep trees, but we'll do iterative for now or simple parent fetch
  
  const path = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true }
    });
    
    if (!folder) break;
    path.unshift(folder);
    currentId = folder.parentId || "";
  }

  return path;
}

