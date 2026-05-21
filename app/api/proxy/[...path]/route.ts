import { NextRequest, NextResponse } from "next/server";
import { s3Client, storageBucketName, GetObjectCommand } from "@/lib/storage";

// Disable static optimization and caching for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const key = params.path.join("/");
  
  console.log(`[Proxy] Fetching key: ${key} from bucket: ${storageBucketName}`);

  // Forward Range header for video seeking
  const rangeHeader = req.headers.get('range');

  try {
    const command = new GetObjectCommand({
      Bucket: storageBucketName,
      Key: key,
      Range: rangeHeader || undefined,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const responseHeaders = new Headers();
    
    // Set Content-Type
    if (response.ContentType) {
      responseHeaders.set('Content-Type', response.ContentType);
    }
    
    // Set Content-Length
    if (response.ContentLength) {
      responseHeaders.set('Content-Length', response.ContentLength.toString());
    }
    
    // Handle Range requests for video streaming
    if (response.ContentRange) {
      responseHeaders.set('Content-Range', response.ContentRange);
    }
    if (response.AcceptRanges) {
      responseHeaders.set('Accept-Ranges', response.AcceptRanges);
    }
    
    // Enable CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Convert the readable stream to a web ReadableStream
    const webStream = response.Body.transformToWebStream();

    // Return 206 for partial content, 200 for full content
    const status = rangeHeader && response.ContentRange ? 206 : 200;

    return new NextResponse(webStream, {
      status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Proxy Error]:", error.message);
    if (error.name === 'NoSuchKey') {
      return new NextResponse("File not found", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
