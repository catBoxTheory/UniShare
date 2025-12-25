import { NextRequest, NextResponse } from "next/server";

// Disable static optimization and caching for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const minioUrl = `${process.env.MINIO_ENDPOINT || "http://localhost:9000"}/${path}`;

  // Forward Range header for video seeking
  const rangeHeader = req.headers.get('range');
  const headers: HeadersInit = {};
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  try {
    const response = await fetch(minioUrl, {
      cache: 'no-store',  // Disable caching to avoid 2MB limit error
      headers,
    });
    
    // 206 Partial Content is valid for range requests
    if (!response.ok && response.status !== 206) {
      return new NextResponse("File not found", { status: response.status });
    }

    const responseHeaders = new Headers();
    // Copy important headers for video streaming
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
      const value = response.headers.get(h);
      if (value) responseHeaders.set(h, value);
    });
    // Enable CORS
    responseHeaders.set('access-control-allow-origin', '*');
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
