import { NextRequest, NextResponse } from "next/server";
import { fetchAndTranslateSubtitles } from "@/lib/actions/transcripts";

export const maxDuration = 60; // Allow up to 1 minute for subtitle fetching and translation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, translateToChinese = true } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Subtitle request for video: ${videoId}`);

    const result = await fetchAndTranslateSubtitles(videoId, translateToChinese);

    if (!result.success) {
      // Special handling for "no subtitles" case
      if (result.noSubtitles) {
        return NextResponse.json(
          { 
            error: result.error || "No captions available",
            noSubtitles: true,
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || "Failed to fetch subtitles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      englishSubtitles: result.englishSubtitles,
      chineseSubtitles: result.chineseSubtitles,
    });
  } catch (error) {
    console.error("[API] Subtitle error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    message: "YouTube caption fetching service is available",
  });
}

