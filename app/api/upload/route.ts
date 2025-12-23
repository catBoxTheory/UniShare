import { NextRequest, NextResponse } from "next/server";
import { uploadFileToMinio } from "@/lib/storage";
import prisma from "@/lib/prisma";
import { MaterialType } from "@prisma/client";

export async function POST(req: NextRequest) {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'app/api/upload/route.ts:POST',
        message: 'Upload API called',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'upload-flow'
      })
    }).catch(() => {});
  } catch (e) {}
  // #endregion

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadFileToMinio(
      buffer,
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

