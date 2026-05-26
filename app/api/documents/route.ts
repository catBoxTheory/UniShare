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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

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

    // Build where clause for documents
    const whereClause: {
      courseId: string;
      type: { not: MaterialType };
      folderId?: string | null;
    } = {
      courseId,
      type: { not: MaterialType.VIDEO }
    };

    if (folderId && folderId !== "root") {
      whereClause.folderId = folderId;
    } else {
      whereClause.folderId = null;
    }

    const [rawDocuments, totalCount] = await Promise.all([
      prisma.material.findMany({
        where: whereClause,
        orderBy: materialOrderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          url: true,
          type: true,
          folderId: true,
          createdAt: true,
          ratings: {
            select: { userId: true, rating: true },
          },
          _count: { select: { comments: true } },
        },
      }),
      prisma.material.count({ where: whereClause }),
    ]);

    // Get user's bookmarks
    let bookmarkedIds = new Set<string>();
    if (userId) {
      const bookmarks = await prisma.savedMaterial.findMany({
        where: { userId, materialId: { in: rawDocuments.map((d) => d.id) } },
        select: { materialId: true },
      });
      bookmarkedIds = new Set(bookmarks.map((b) => b.materialId));
    }

    const documents = rawDocuments.map(({ ratings, _count, ...doc }) => {
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
        : 0;
      const userRating = userId
        ? ratings.find((r) => r.userId === userId)?.rating || null
        : null;
      return {
        ...doc,
        avgRating,
        totalRatings,
        userRating,
        commentCount: _count.comments,
        isBookmarked: bookmarkedIds.has(doc.id),
      };
    });

    // Get subfolders in the current folder - ONLY DOCUMENT type folders
    const folders = await prisma.folder.findMany({
      where: {
        courseId,
        type: FolderType.DOCUMENT,
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
      documents,
      folders,
      currentFolder,
      pagination: { page, pageSize, total: totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
