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
  "https://yewtu.be",
];

// Fetch transcript using Invidious API (fallback method)
async function fetchFromInvidious(videoId: string): Promise<SubtitleSegment[] | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`[Invidious] Trying ${instance}`);
      const response = await fetch(`${instance}/api/v1/captions/${videoId}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        console.log(`[Invidious] ${instance} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`[Invidious] Got captions data:`, JSON.stringify(data).slice(0, 200));
      
      // Find English caption
      const englishCaption = data.captions?.find((c: any) => 
        c.language_code === 'en' || 
        c.language_code?.startsWith('en') ||
        c.label?.toLowerCase().includes('english')
      );
      
      if (!englishCaption) {
        console.log(`[Invidious] No English caption found at ${instance}`);
        continue;
      }
      
      // Fetch the actual caption content
      const captionUrl = englishCaption.url?.startsWith('http') 
        ? englishCaption.url 
        : `${instance}${englishCaption.url}`;
      
      console.log(`[Invidious] Fetching caption from: ${captionUrl}`);
        
      const captionResponse = await fetch(captionUrl, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (!captionResponse.ok) {
        console.log(`[Invidious] Caption fetch failed: ${captionResponse.status}`);
        continue;
      }
      
      const captionText = await captionResponse.text();
      console.log(`[Invidious] Got caption text, length: ${captionText.length}`);
      
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
        console.log(`[Invidious] Parsed ${segments.length} segments from XML`);
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
        console.log(`[Invidious] Parsed ${segments.length} segments from VTT`);
        return segments;
      }
      
      console.log(`[Invidious] Could not parse caption format`);
      
    } catch (e: any) {
      console.log(`[Invidious] ${instance} failed:`, e.message);
      continue;
    }
  }
  return null;
}

// Fetch transcript using YouTube's Innertube API
async function fetchFromInnertube(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    console.log(`[Innertube] Fetching for ${videoId}`);
    
    // First, get the initial player response to find caption tracks
    const playerResponse = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.04.00',
            hl: 'en',
            gl: 'US',
          }
        },
        videoId: videoId
      })
    });

    if (!playerResponse.ok) {
      console.log(`[Innertube] Player API returned ${playerResponse.status}`);
      return null;
    }

    const playerData = await playerResponse.json();
    
    // Check for captions in the response
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      console.log(`[Innertube] No caption tracks found in player response`);
      return null;
    }
    
    console.log(`[Innertube] Found ${captionTracks.length} caption tracks`);
    
    // Find English track (prioritize manual over auto-generated)
    const englishTrack = 
      captionTracks.find((t: any) => t.languageCode === 'en' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'en') ||
      captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
      captionTracks.find((t: any) => t.name?.simpleText?.toLowerCase().includes('english'));
    
    if (!englishTrack?.baseUrl) {
      console.log(`[Innertube] No English track found`);
      return null;
    }
    
    console.log(`[Innertube] Using track: ${englishTrack.name?.simpleText || englishTrack.languageCode}`);
    
    // Fetch the transcript XML
    const xmlResponse = await fetch(englishTrack.baseUrl);
    if (!xmlResponse.ok) {
      console.log(`[Innertube] Failed to fetch transcript XML: ${xmlResponse.status}`);
      return null;
    }
    
    const xmlText = await xmlResponse.text();
    console.log(`[Innertube] Got XML, length: ${xmlText.length}`);
    
    const segments: SubtitleSegment[] = [];
    const matches = [...xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)];
    
    matches.forEach(m => {
      segments.push({
        text: he.decode(m[3].replace(/<[^>]*>/g, '').trim()),
        offset: parseFloat(m[1]) * 1000,
        duration: parseFloat(m[2]) * 1000
      });
    });
    
    console.log(`[Innertube] Parsed ${segments.length} segments`);
    return segments.length > 0 ? segments : null;
    
  } catch (e: any) {
    console.error("[Innertube] Failed:", e.message);
    return null;
  }
}

// Fetch transcript by scraping YouTube page
async function fetchFromYouTubeScrape(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    console.log(`[YT-Scrape] Fetching page for ${videoId}`);
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20231220-00-p0.en+FX+000',
      }
    });
    
    const html = await response.text();
    console.log(`[YT-Scrape] Got HTML, length: ${html.length}`);
    
    // Try multiple patterns to find captionTracks
    let captionTracks = null;
    
    // Pattern 1: Direct captionTracks array
    const pattern1 = html.match(/"captionTracks":\s*(\[[\s\S]*?\])(?=\s*[,}])/);
    if (pattern1) {
      try {
        captionTracks = JSON.parse(pattern1[1]);
        console.log(`[YT-Scrape] Pattern 1 found ${captionTracks.length} tracks`);
      } catch (e) {
        console.log(`[YT-Scrape] Pattern 1 parse failed`);
      }
    }
    
    // Pattern 2: Look in ytInitialPlayerResponse
    if (!captionTracks) {
      const pattern2 = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/);
      if (pattern2) {
        try {
          const playerData = JSON.parse(pattern2[1]);
          captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (captionTracks) {
            console.log(`[YT-Scrape] Pattern 2 found ${captionTracks.length} tracks`);
          }
        } catch (e) {
          console.log(`[YT-Scrape] Pattern 2 parse failed`);
        }
      }
    }
    
    if (!captionTracks || captionTracks.length === 0) {
      console.log(`[YT-Scrape] No caption tracks found`);
      return null;
    }
    
    // Find English track
    const englishTrack = 
      captionTracks.find((t: any) => t.languageCode === 'en' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'en') ||
      captionTracks.find((t: any) => t.languageCode?.startsWith('en'));
    
    if (!englishTrack?.baseUrl) {
      console.log(`[YT-Scrape] No English track with baseUrl found`);
      return null;
    }
    
    console.log(`[YT-Scrape] Found English track, fetching XML...`);
    
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
    
    console.log(`[YT-Scrape] Parsed ${segments.length} segments`);
    return segments.length > 0 ? segments : null;
    
  } catch (e: any) {
    console.error("[YT-Scrape] Failed:", e.message);
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

  console.log(`\n========== Transcript Request for ${videoId} ==========`);

  try {
    let transcript: SubtitleSegment[] | null = null;
    
    // Method 1: Try youtube-transcript library (fast but may fail on some videos)
    console.log(`[Transcript] Method 1: youtube-transcript library`);
    try {
      const result = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      if (result && result.length > 0) {
        transcript = result.map(item => ({
          text: he.decode(item.text),
          duration: item.duration,
          offset: item.offset
        }));
        console.log(`[Transcript] SUCCESS via youtube-transcript: ${transcript.length} segments`);
      }
    } catch (e: any) {
      console.log(`[Transcript] youtube-transcript failed: ${e.message}`);
    }
    
    // Method 2: Try YouTube Innertube API (official internal API)
    if (!transcript) {
      console.log(`[Transcript] Method 2: YouTube Innertube API`);
      transcript = await fetchFromInnertube(videoId);
      if (transcript) {
        console.log(`[Transcript] SUCCESS via Innertube: ${transcript.length} segments`);
      }
    }
    
    // Method 3: Try YouTube page scraping
    if (!transcript) {
      console.log(`[Transcript] Method 3: YouTube page scraping`);
      transcript = await fetchFromYouTubeScrape(videoId);
      if (transcript) {
        console.log(`[Transcript] SUCCESS via YT-Scrape: ${transcript.length} segments`);
      }
    }
    
    // Method 4: Try Invidious API (third-party, may be rate-limited)
    if (!transcript) {
      console.log(`[Transcript] Method 4: Invidious API`);
      transcript = await fetchFromInvidious(videoId);
      if (transcript) {
        console.log(`[Transcript] SUCCESS via Invidious: ${transcript.length} segments`);
      }
    }
    
    if (!transcript || transcript.length === 0) {
      console.log(`[Transcript] FAILED: All methods exhausted for ${videoId}`);
      return NextResponse.json({ 
        error: "No subtitles found. The video may not have captions available.",
        code: "NO_TRANSCRIPT" 
      }, { status: 404 });
    }

    console.log(`[Transcript] Proceeding to translation with ${transcript.length} segments`);

    // Limit segments to process (first ~100 for performance)
    const segmentsToProcess = transcript.slice(0, 100);
    
    // Prepare text for translation
    const textBlock = segmentsToProcess.map((seg, i) => `${i}|${seg.text}`).join("\n");

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
    const bilingualSubtitles: BilingualSubtitle[] = segmentsToProcess.map((seg, index) => ({
      start: seg.offset,
      duration: seg.duration,
      textEn: seg.text,
      textZh: translationMap.get(index.toString()) || "翻譯不可用"
    }));

    console.log(`[Transcript] SUCCESS: Returning ${bilingualSubtitles.length} bilingual subtitles`);
    return NextResponse.json({ subtitles: bilingualSubtitles });

  } catch (error: any) {
    console.error("[Transcript] FATAL ERROR:", error);
    
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
