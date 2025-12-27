import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

// Initialize OpenAI client for DeepSeek
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export const dynamic = 'force-dynamic';

interface SubtitleSegment {
  text: string;
  start: number;
  duration: number;
}

interface BilingualSubtitle {
  start: number;
  duration: number;
  textEn: string;
  textZh: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { segments } = await req.json();
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "No segments provided" }, { status: 400 });
    }

    console.log(`[Translate] Received ${segments.length} segments for translation`);

    // Prepare text for translation
    const textBlock = segments.map((seg: SubtitleSegment, i: number) => `${i}|${seg.text}`).join("\n");

    // Translate to Traditional Chinese (zh-TW)
    const systemPrompt = `You are a professional translator.
Translate the following English video subtitles into Traditional Chinese (繁體中文/zh-TW).
The input format is "index|English text".
The output format must be "index|Traditional Chinese text".
Maintain the same number of lines.
Keep the translation concise and suitable for subtitles.
Do not output anything else.`;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textBlock }
      ],
      temperature: 1.0,
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
    const bilingualSubtitles: BilingualSubtitle[] = segments.map((seg: SubtitleSegment, index: number) => ({
      start: seg.start,
      duration: seg.duration,
      textEn: seg.text,
      textZh: translationMap.get(index.toString()) || "翻譯不可用"
    }));

    console.log(`[Translate] Successfully translated ${bilingualSubtitles.length} segments`);
    return NextResponse.json({ subtitles: bilingualSubtitles });

  } catch (error: any) {
    console.error("[Translate] Error:", error);
    return NextResponse.json({ 
      error: "Translation failed", 
      details: error.message 
    }, { status: 500 });
  }
}

