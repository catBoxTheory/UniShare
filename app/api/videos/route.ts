import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { MaterialType, FolderType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const folderId = searchParams.get("folderId");
    const sort = searchParams.get("sort") || "name_asc";

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Determine order
    let materialOrderBy: any = { title: "asc" };
    let folderOrderBy: any = { name: "asc" };

    if (sort === "name_desc") {
      materialOrderBy = { title: "desc" };
      folderOrderBy = { name: "desc" };
    } else if (sort === "newest") {
      materialOrderBy = { createdAt: "desc" };
      folderOrderBy = { createdAt: "desc" };
    } else if (sort === "oldest") {
      materialOrderBy = { createdAt: "asc" };
      folderOrderBy = { createdAt: "asc" };
    }

    // Build where clause for videos
    const whereClause: {
      courseId: string;
      type: MaterialType;
      folderId?: string | null;
    } = {
      courseId,
      type: MaterialType.VIDEO
    };

    if (folderId && folderId !== "root") {
      whereClause.folderId = folderId;
    } else {
      whereClause.folderId = null;
    }

    const rawVideos = await prisma.material.findMany({
      where: whereClause,
      orderBy: materialOrderBy,
      select: {
        id: true,
        title: true,
        url: true,
        folderId: true,
        createdAt: true,
        ratings: {
          select: { userId: true, rating: true },
        },
      }
    });

    const videos = rawVideos.map(({ ratings, ...vid }) => {
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
        : 0;
      const userRating = userId
        ? ratings.find((r) => r.userId === userId)?.rating || null
        : null;
      return { ...vid, avgRating, totalRatings, userRating };
    });

    // Get subfolders in the current folder - ONLY VIDEO type folders
    const folders = await prisma.folder.findMany({
      where: {
        courseId,
        type: FolderType.VIDEO,
        parentId: folderId && folderId !== "root" ? folderId : null
      },
      orderBy: folderOrderBy,
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
      videos,
      folders,
      currentFolder
    });
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
