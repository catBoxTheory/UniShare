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
export const maxDuration = 60; // Allow up to 60 seconds

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

// Parse XML transcript format
function parseXmlTranscript(xmlText: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const matches = [...xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)];
  
  matches.forEach(m => {
    const text = he.decode(m[3].replace(/<[^>]*>/g, '').trim());
    if (text) {
      segments.push({
        text,
        offset: parseFloat(m[1]) * 1000,
        duration: parseFloat(m[2]) * 1000
      });
    }
  });
  
  return segments;
}

// Try to fetch using Supadata (third-party YouTube transcript API)
async function fetchFromSupadata(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    console.log(`[Supadata] Trying for ${videoId}`);
    
    // Supadata provides a free tier for YouTube transcripts
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?video_id=${videoId}&text=true`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      console.log(`[Supadata] Returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.content && Array.isArray(data.content)) {
      const segments = data.content.map((item: any) => ({
        text: item.text || '',
        offset: (item.offset || item.start || 0) * 1000,
        duration: (item.duration || 3) * 1000
      })).filter((s: SubtitleSegment) => s.text);
      
      if (segments.length > 0) {
        console.log(`[Supadata] Got ${segments.length} segments`);
        return segments;
      }
    }
    
    return null;
  } catch (e: any) {
    console.log(`[Supadata] Failed: ${e.message}`);
    return null;
  }
}

// Deep scrape - extract everything and search for captions
async function fetchFromDeepScrape(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    console.log(`[DeepScrape] Fetching for ${videoId}`);
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESHAgBEhJnd3NfMjAyMzEyMTAtMF9SQzEaAmVuIAEaBgiA_LyqBg',
      }
    });
    
    const html = await response.text();
    console.log(`[DeepScrape] Got HTML, length: ${html.length}`);
    
    // Method 1: Find baseUrl directly in HTML
    const baseUrlMatches = html.matchAll(/"baseUrl"\s*:\s*"(https?:\\\/\\\/www\.youtube\.com\\\/api\\\/timedtext[^"]+)"/g);
    
    for (const match of baseUrlMatches) {
      try {
        // Decode the URL
        let url = match[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/')
          .replace(/\\"/g, '"');
        
        console.log(`[DeepScrape] Found timedtext URL: ${url.substring(0, 80)}...`);
        
        // Check if it's English
        if (url.includes('lang=en') || url.includes('lang%3Den')) {
          const xmlResponse = await fetch(url);
          if (xmlResponse.ok) {
            const xmlText = await xmlResponse.text();
            const segments = parseXmlTranscript(xmlText);
            if (segments.length > 0) {
              console.log(`[DeepScrape] Got ${segments.length} segments from baseUrl`);
              return segments;
            }
          }
        }
      } catch (e) {
        console.log(`[DeepScrape] baseUrl fetch failed`);
      }
    }
    
    // Method 2: Extract ytInitialPlayerResponse JSON
    const playerResponseMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
    
    if (playerResponseMatch) {
      try {
        const playerData = JSON.parse(playerResponseMatch[1]);
        console.log(`[DeepScrape] Parsed ytInitialPlayerResponse`);
        
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (captionTracks && captionTracks.length > 0) {
          console.log(`[DeepScrape] Found ${captionTracks.length} caption tracks in playerResponse`);
          
          // Find English track
          const englishTrack = 
            captionTracks.find((t: any) => t.languageCode === 'en' && !t.kind) ||
            captionTracks.find((t: any) => t.languageCode === 'en') ||
            captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
            captionTracks[0]; // Fallback to first track
          
          if (englishTrack?.baseUrl) {
            const xmlResponse = await fetch(englishTrack.baseUrl);
            if (xmlResponse.ok) {
              const xmlText = await xmlResponse.text();
              const segments = parseXmlTranscript(xmlText);
              if (segments.length > 0) {
                console.log(`[DeepScrape] Got ${segments.length} segments from captionTracks`);
                return segments;
              }
            }
          }
        } else {
          console.log(`[DeepScrape] No captionTracks in playerResponse`);
        }
      } catch (e: any) {
        console.log(`[DeepScrape] Failed to parse playerResponse: ${e.message}`);
      }
    }
    
    // Method 3: Search for any timedtext URL in the HTML
    const timedtextUrls = html.match(/https?:\/\/www\.youtube\.com\/api\/timedtext[^"'\s<>]+/g);
    
    if (timedtextUrls) {
      console.log(`[DeepScrape] Found ${timedtextUrls.length} timedtext URLs in HTML`);
      
      for (const rawUrl of timedtextUrls) {
        try {
          const url = rawUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
          
          const xmlResponse = await fetch(url);
          if (xmlResponse.ok) {
            const xmlText = await xmlResponse.text();
            if (xmlText.includes('<text')) {
              const segments = parseXmlTranscript(xmlText);
              if (segments.length > 0) {
                console.log(`[DeepScrape] Got ${segments.length} segments from timedtext URL`);
                return segments;
              }
            }
          }
        } catch (e) {}
      }
    }
    
    // Method 4: Log what we found for debugging
    const hasCaption = html.includes('captionTracks');
    const hasTimedtext = html.includes('timedtext');
    const hasPlayerResponse = html.includes('ytInitialPlayerResponse');
    console.log(`[DeepScrape] Debug: hasCaption=${hasCaption}, hasTimedtext=${hasTimedtext}, hasPlayerResponse=${hasPlayerResponse}`);
    
    return null;
    
  } catch (e: any) {
    console.error(`[DeepScrape] Failed: ${e.message}`);
    return null;
  }
}

// Innertube API with TV client (often has better access)
async function fetchFromInnertube(videoId: string): Promise<SubtitleSegment[] | null> {
  const clients = [
    { clientName: 'WEB', clientVersion: '2.20231219.04.00' },
    { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30 },
    { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0' },
  ];
  
  for (const client of clients) {
    try {
      console.log(`[Innertube] Trying ${client.clientName}`);
      
      const response = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify({
          context: {
            client: {
              ...client,
              hl: 'en',
              gl: 'US',
            }
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!tracks || tracks.length === 0) {
        console.log(`[Innertube] ${client.clientName}: No tracks`);
        continue;
      }
      
      console.log(`[Innertube] ${client.clientName}: Found ${tracks.length} tracks`);
      
      const englishTrack = tracks.find((t: any) => t.languageCode?.startsWith('en')) || tracks[0];
      
      if (englishTrack?.baseUrl) {
        const xmlResponse = await fetch(englishTrack.baseUrl);
        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          const segments = parseXmlTranscript(xmlText);
          if (segments.length > 0) {
            console.log(`[Innertube] Got ${segments.length} segments`);
            return segments;
          }
        }
      }
    } catch (e: any) {
      console.log(`[Innertube] ${client.clientName} failed: ${e.message}`);
    }
  }
  
  return null;
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
    
    // Method 1: youtube-transcript library (fastest when it works)
    console.log(`[Transcript] Method 1: youtube-transcript library`);
    try {
      const result = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      if (result && result.length > 0) {
        transcript = result.map(item => ({
          text: he.decode(item.text),
          duration: item.duration,
          offset: item.offset
        }));
        console.log(`[Transcript] SUCCESS: ${transcript.length} segments`);
      }
    } catch (e: any) {
      console.log(`[Transcript] youtube-transcript failed: ${e.message?.substring(0, 50)}`);
    }
    
    // Method 2: Deep scrape with multiple extraction methods
    if (!transcript) {
      console.log(`[Transcript] Method 2: Deep Scrape`);
      transcript = await fetchFromDeepScrape(videoId);
    }
    
    // Method 3: Innertube API
    if (!transcript) {
      console.log(`[Transcript] Method 3: Innertube API`);
      transcript = await fetchFromInnertube(videoId);
    }
    
    // Method 4: Supadata API (third-party service)
    if (!transcript) {
      console.log(`[Transcript] Method 4: Supadata API`);
      transcript = await fetchFromSupadata(videoId);
    }
    
    if (!transcript || transcript.length === 0) {
      console.log(`[Transcript] FAILED: All methods exhausted`);
      return NextResponse.json({ 
        error: "No subtitles found",
        code: "NO_TRANSCRIPT" 
      }, { status: 404 });
    }

    console.log(`[Transcript] Translating ${transcript.length} segments...`);

    // Limit and translate
    const segmentsToProcess = transcript.slice(0, 100);
    const textBlock = segmentsToProcess.map((seg, i) => `${i}|${seg.text}`).join("\n");

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
    
    const translationMap = new Map<string, string>();
    translatedText.split("\n").forEach(line => {
      const match = line.match(/^(\d+)\|(.*)$/);
      if (match) {
        translationMap.set(match[1], match[2].trim());
      }
    });

    const bilingualSubtitles: BilingualSubtitle[] = segmentsToProcess.map((seg, index) => ({
      start: seg.offset,
      duration: seg.duration,
      textEn: seg.text,
      textZh: translationMap.get(index.toString()) || "翻譯不可用"
    }));

    console.log(`[Transcript] SUCCESS: ${bilingualSubtitles.length} bilingual subtitles`);
    return NextResponse.json({ subtitles: bilingualSubtitles });

  } catch (error: any) {
    console.error("[Transcript] FATAL:", error);
    return NextResponse.json({ 
      error: "Failed to process subtitles", 
      details: error.message 
    }, { status: 500 });
  }
}
