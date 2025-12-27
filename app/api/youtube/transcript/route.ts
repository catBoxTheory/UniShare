import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import he from "he";
import { auth } from "@/auth";

// Initialize OpenAI client for DeepSeek
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com",
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

// List of public Invidious instances to try as fallback
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.fdn.fr",
  "https://vid.puffyan.us",
  "https://invidious.nerdvpn.de",
];

// Fetch transcript using Invidious API (fallback method)
async function fetchFromInvidious(videoId: string): Promise<SubtitleSegment[] | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/captions/${videoId}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Find English caption
      const englishCaption = data.captions?.find((c: any) => 
        c.language_code === 'en' || 
        c.language_code?.startsWith('en') ||
        c.label?.toLowerCase().includes('english')
      );
      
      if (!englishCaption) continue;
      
      // Fetch the actual caption content
      const captionUrl = englishCaption.url?.startsWith('http') 
        ? englishCaption.url 
        : `${instance}${englishCaption.url}`;
        
      const captionResponse = await fetch(captionUrl, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!captionResponse.ok) continue;
      
      const captionText = await captionResponse.text();
      
      // Parse XML/VTT format
      const segments: SubtitleSegment[] = [];
      
      // Try XML format first
      const xmlMatches = [...captionText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/gs)];
      if (xmlMatches.length > 0) {
        xmlMatches.forEach(m => {
          segments.push({
            text: he.decode(m[3].replace(/<[^>]*>/g, '')),
            offset: parseFloat(m[1]) * 1000,
            duration: parseFloat(m[2]) * 1000
          });
        });
        return segments;
      }
      
      // Try VTT format
      const vttMatches = [...captionText.matchAll(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})\n([\s\S]*?)(?=\n\n|\n\d|$)/g)];
      if (vttMatches.length > 0) {
        vttMatches.forEach(m => {
          const startMs = (parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3])) * 1000 + parseInt(m[4]);
          const endMs = (parseInt(m[5]) * 3600 + parseInt(m[6]) * 60 + parseInt(m[7])) * 1000 + parseInt(m[8]);
          segments.push({
            text: he.decode(m[9].trim().replace(/<[^>]*>/g, '')),
            offset: startMs,
            duration: endMs - startMs
          });
        });
        return segments;
      }
      
    } catch (e) {
      console.log(`Invidious instance ${instance} failed:`, e);
      continue;
    }
  }
  return null;
}

// Fetch transcript using YouTube's internal API
async function fetchFromYouTubeInternal(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    // Use YouTube's internal API
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    const html = await response.text();
    
    // Try to find captionTracks in the page data
    const captionMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])\s*,\s*"/);
    
    if (!captionMatch) {
      // Try alternative pattern
      const altMatch = html.match(/captionTracks.*?(\[.*?\])/s);
      if (!altMatch) return null;
    }
    
    const captionData = captionMatch ? captionMatch[1] : null;
    if (!captionData) return null;
    
    // Clean up the JSON (sometimes it has trailing content)
    let cleanJson = captionData;
    try {
      // Find the proper closing bracket
      let depth = 0;
      let endIndex = 0;
      for (let i = 0; i < captionData.length; i++) {
        if (captionData[i] === '[') depth++;
        if (captionData[i] === ']') depth--;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
      cleanJson = captionData.substring(0, endIndex);
    } catch (e) {}
    
    const captionTracks = JSON.parse(cleanJson);
    
    // Find English track
    const englishTrack = 
      captionTracks.find((t: any) => t.languageCode === 'en' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'en') ||
      captionTracks.find((t: any) => t.languageCode?.startsWith('en'));
    
    if (!englishTrack?.baseUrl) return null;
    
    // Fetch the transcript XML
    const xmlResponse = await fetch(englishTrack.baseUrl);
    const xmlText = await xmlResponse.text();
    
    const segments: SubtitleSegment[] = [];
    const matches = [...xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)];
    
    matches.forEach(m => {
      segments.push({
        text: he.decode(m[3].replace(/<[^>]*>/g, '').trim()),
        offset: parseFloat(m[1]) * 1000,
        duration: parseFloat(m[2]) * 1000
      });
    });
    
    return segments.length > 0 ? segments : null;
    
  } catch (e) {
    console.error("YouTube internal fetch failed:", e);
    return null;
  }
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
    let transcript: SubtitleSegment[] | null = null;
    
    // Method 1: Try youtube-transcript library
    console.log(`[Transcript] Attempting youtube-transcript for ${videoId}`);
    try {
      const result = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      if (result && result.length > 0) {
        transcript = result.map(item => ({
          text: he.decode(item.text),
          duration: item.duration,
          offset: item.offset
        }));
        console.log(`[Transcript] youtube-transcript succeeded: ${transcript.length} segments`);
      }
    } catch (e) {
      console.log("[Transcript] youtube-transcript failed, trying alternatives...");
    }
    
    // Method 2: Try Invidious API
    if (!transcript) {
      console.log(`[Transcript] Attempting Invidious API for ${videoId}`);
      transcript = await fetchFromInvidious(videoId);
      if (transcript) {
        console.log(`[Transcript] Invidious succeeded: ${transcript.length} segments`);
      }
    }
    
    // Method 3: Try YouTube internal extraction
    if (!transcript) {
      console.log(`[Transcript] Attempting YouTube internal for ${videoId}`);
      transcript = await fetchFromYouTubeInternal(videoId);
      if (transcript) {
        console.log(`[Transcript] YouTube internal succeeded: ${transcript.length} segments`);
      }
    }
    
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ 
        error: "No subtitles found. The video may not have captions available.",
        code: "NO_TRANSCRIPT" 
      }, { status: 404 });
    }

    // Limit segments to process (first ~100 for performance)
    const segmentsToProcess = transcript.slice(0, 100);
    
    // Prepare text for translation
    const textBlock = segmentsToProcess.map((seg, i) => `${i}|${seg.text}`).join("\n");

    // CHANGED: Now translating to Traditional Chinese (zh-TW)
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
    const bilingualSubtitles: BilingualSubtitle[] = segmentsToProcess.map((seg, index) => ({
      start: seg.offset,
      duration: seg.duration,
      textEn: seg.text,
      textZh: translationMap.get(index.toString()) || "翻譯不可用"
    }));

    return NextResponse.json({ subtitles: bilingualSubtitles });

  } catch (error: any) {
    console.error("Transcript/Translation error:", error);
    
    if (error.message?.includes("Transcript is disabled") || error.message?.includes("No transcript found")) {
      return NextResponse.json({ 
        error: "Subtitles are disabled or unavailable for this video.",
        code: "NO_TRANSCRIPT" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: "Failed to process subtitles", 
      details: error.message 
    }, { status: 500 });
  }
}
