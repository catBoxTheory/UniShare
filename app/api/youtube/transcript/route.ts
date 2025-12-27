import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import he from "he";
import { auth } from "@/auth";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

interface SubtitleSegment {
  text: string;
  duration: number;
  offset: number;
}

interface BilingualSubtitle {
  start: number;
  duration: number;
  textEn: string;
  textZh: string;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    // 1. Fetch English transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript found" }, { status: 404 });
    }

    // 2. Process transcript to combine short segments
    // OpenAI charges by token, and context matters. Grouping sentences helps.
    const processedSegments: SubtitleSegment[] = transcript.map(item => ({
      text: he.decode(item.text),
      duration: item.duration,
      offset: item.offset
    }));

    // Limit the number of segments to process to avoid excessive API usage/time
    // For a demo/MVP, we might limit to first 10-15 minutes or specific count
    // But for now, let's process the whole thing in batches
    
    const BATCH_SIZE = 20; // Process 20 segments at a time to keep context but not overload
    const bilingualSubtitles: BilingualSubtitle[] = [];

    // For this implementation, we will process the first batch immediately 
    // and maybe todo: implement streaming or pagination for long videos.
    // To ensure responsiveness, let's process the first 50 segments (approx 3-5 mins)
    const segmentsToProcess = processedSegments.slice(0, 100); 

    // Prepare text for translation
    // We'll send a structured prompt to get line-by-line translation
    const textBlock = segmentsToProcess.map((seg, i) => `${i}|${seg.text}`).join("\n");

    const systemPrompt = `You are a professional translator. 
    Translate the following English video subtitles into Simplified Chinese (zh-CN).
    The input format is "index|English text".
    The output format must be "index|Chinese text".
    Maintain the same number of lines.
    Keep the translation concise and suitable for subtitles.
    Do not output anything else.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textBlock }
      ],
      temperature: 0.3,
    });

    const translatedText = completion.choices[0].message.content || "";
    
    // Parse translation
    const translationMap = new Map<string, string>();
    translatedText.split("\n").forEach(line => {
      const match = line.match(/^(\d+)\|(.*)$/);
      if (match) {
        translationMap.set(match[1], match[2].trim());
      }
    });

    // Merge results
    segmentsToProcess.forEach((seg, index) => {
      bilingualSubtitles.push({
        start: seg.offset,
        duration: seg.duration,
        textEn: seg.text,
        textZh: translationMap.get(index.toString()) || "Translation unavailable"
      });
    });

    return NextResponse.json({ subtitles: bilingualSubtitles });

  } catch (error: any) {
    console.error("Transcript/Translation error:", error);
    return NextResponse.json({ 
      error: "Failed to process subtitles", 
      details: error.message 
    }, { status: 500 });
  }
}

