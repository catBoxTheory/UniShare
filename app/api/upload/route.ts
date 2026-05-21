import { NextRequest, NextResponse } from "next/server";
import { uploadFileToMinio } from "@/lib/storage";
import prisma from "@/lib/prisma";
import { MaterialType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file.name;
    const courseId = formData.get("courseId") as string;
    const folderId = formData.get("folderId") as string | null;
    
    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!courseId) {
      return NextResponse.json({ error: "No courseId provided" }, { status: 400 });
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const uint8Array = new Uint8Array(buffer);
    
    // Note: On Vercel, this POST route is limited to 4.5MB.
    // For larger files, we now use the /api/upload/presigned route.
    const fileUrl = await uploadFileToMinio(
      uint8Array,
      file.name,
      file.type
    );

    // Determine material type based on file extension and MIME type
    let type: MaterialType = MaterialType.FILE;
    
    // Check for video files
    const videoExtensions = /\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v|3gp)$/i;
    const isVideo = file.type.startsWith("video/") || videoExtensions.test(file.name);
    
    if (isVideo) {
      type = MaterialType.VIDEO;
    }
    
    console.log(`File uploaded: ${file.name}, Type: ${file.type}, Detected as: ${type}`);
    
    // Save metadata to database
    await prisma.material.create({
      data: {
        title,
        url: fileUrl,
        type,
        courseId,
        folderId: folderId || null,
      },
    });

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

