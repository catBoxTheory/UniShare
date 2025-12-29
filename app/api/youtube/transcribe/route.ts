import { NextRequest, NextResponse } from "next/server";
import { transcribeAudioFromYoutube, isTranscriptionAvailable } from "@/lib/actions/transcripts";

export const maxDuration = 120; // Allow up to 2 minutes for transcription

export async function POST(request: NextRequest) {
  try {
    // Check if transcription is available
    const available = await isTranscriptionAvailable();
    if (!available) {
      return NextResponse.json(
        { error: "Transcription service not configured. Please set ASSEMBLYAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { videoId, translateToChinese = true } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Transcription request for video: ${videoId}`);

    const result = await transcribeAudioFromYoutube(videoId, translateToChinese);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Transcription failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      englishSubtitles: result.englishSubtitles,
      chineseSubtitles: result.chineseSubtitles,
    });
  } catch (error) {
    console.error("[API] Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if transcription service is available
  const available = await isTranscriptionAvailable();
  
  return NextResponse.json({
    available,
    message: available
      ? "Transcription service is available (AssemblyAI)"
      : "Transcription service not configured. Please set ASSEMBLYAI_API_KEY.",
  });
}

