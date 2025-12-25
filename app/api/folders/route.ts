import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FolderType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, courseId, parentId, type } = body;

    if (!name || !courseId) {
      return NextResponse.json(
        { error: "name and courseId are required" },
        { status: 400 }
      );
    }

    // Validate and use folder type (default to DOCUMENT if not provided)
    const folderType: FolderType = type === "VIDEO" ? FolderType.VIDEO : FolderType.DOCUMENT;

    const folder = await prisma.folder.create({
      data: {
        name,
        courseId,
        parentId: parentId || null,
        type: folderType,
      },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        createdAt: true,
      }
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { folderId, name } = body;

    if (!folderId || !name) {
      return NextResponse.json(
        { error: "folderId and name are required" },
        { status: 400 }
      );
    }

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, data: folder });
  } catch (error) {
    console.error("Failed to update folder:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 }
      );
    }

    // Delete folder (cascade will delete subfolders and materials)
    await prisma.folder.delete({
      where: { id: folderId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
