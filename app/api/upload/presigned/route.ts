import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/storage";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Force Node.js runtime for S3 SDK compatibility

export async function POST(req: NextRequest) {
  try {
    // Check session
    const session = await auth();
    if (!session?.user) {
      console.log("[Presigned] Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, contentType } = body;
    
    if (!fileName || !contentType) {
      console.log("[Presigned] Missing parameters:", { fileName, contentType });
      return NextResponse.json({ error: "Missing fileName or contentType" }, { status: 400 });
    }

    console.log("[Presigned] Generating URL for:", fileName);
    const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl(fileName, contentType);
    console.log("[Presigned] Generated successfully, key:", key);

    return NextResponse.json({ uploadUrl, key, publicUrl });
  } catch (error: any) {
    console.error("[Presigned] Error:", error.message, error.stack);
    return NextResponse.json({ 
      error: `Failed to generate upload URL: ${error.message}` 
    }, { status: 500 });
  }
}

