import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MaterialType, FolderType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const folderId = searchParams.get("folderId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Build where clause for documents
    const whereClause: {
      courseId: string;
      type: { not: MaterialType };
      folderId?: string | null;
    } = {
      courseId,
      type: { not: MaterialType.VIDEO }
    };

    // If folderId is provided, filter by folder
    // If folderId is "root" or not provided, get documents with no folder (root level)
    if (folderId && folderId !== "root") {
      whereClause.folderId = folderId;
    } else {
      whereClause.folderId = null;
    }

    // Get documents in the specified folder
    const documents = await prisma.material.findMany({
      where: whereClause,
      orderBy: {
        title: "asc"
      },
      select: {
        id: true,
        title: true,
        url: true,
        folderId: true,
        createdAt: true
      }
    });

    // Get subfolders in the current folder - ONLY DOCUMENT type folders
    const folders = await prisma.folder.findMany({
      where: {
        courseId,
        type: FolderType.DOCUMENT,
        parentId: folderId && folderId !== "root" ? folderId : null
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true
      }
    });

    // Get current folder info for breadcrumbs
    let currentFolder = null;
    if (folderId && folderId !== "root") {
      currentFolder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: {
          id: true,
          name: true,
          parentId: true
        }
      });
    }

    return NextResponse.json({
      documents,
      folders,
      currentFolder
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
