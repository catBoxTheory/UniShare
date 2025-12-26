import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    // Use YouTube oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      videoId,
    });
  } catch (error) {
    console.error("YouTube metadata error:", error);
    return NextResponse.json({ error: "Failed to fetch video metadata" }, { status: 500 });
  }
}

