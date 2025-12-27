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
  "https://invidious.privacyredirect.com",
  "https://iv.nboeck.de",
  "https://invidious.protokolla.fi",
];

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

// Parse VTT transcript format
function parseVttTranscript(vttText: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  
  // Split by double newlines to get cues
  const cues = vttText.split(/\n\n+/);
  
  for (const cue of cues) {
    // Match timestamp line: 00:00:00.000 --> 00:00:05.000
    const timestampMatch = cue.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
    if (timestampMatch) {
      const startMs = (parseInt(timestampMatch[1]) * 3600 + parseInt(timestampMatch[2]) * 60 + parseInt(timestampMatch[3])) * 1000 + parseInt(timestampMatch[4]);
      const endMs = (parseInt(timestampMatch[5]) * 3600 + parseInt(timestampMatch[6]) * 60 + parseInt(timestampMatch[7])) * 1000 + parseInt(timestampMatch[8]);
      
      // Get text after timestamp line
      const lines = cue.split('\n');
      const textLines = lines.slice(lines.findIndex(l => l.includes('-->')) + 1);
      const text = he.decode(textLines.join(' ').replace(/<[^>]*>/g, '').trim());
      
      if (text) {
        segments.push({
          text,
          offset: startMs,
          duration: endMs - startMs
        });
      }
    }
  }
  
  return segments;
}

// Fetch transcript using Invidious API
async function fetchFromInvidious(videoId: string): Promise<SubtitleSegment[] | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`[Invidious] Trying ${instance}`);
      
      // First get the list of available captions
      const response = await fetch(`${instance}/api/v1/captions/${videoId}`, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log(`[Invidious] ${instance} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`[Invidious] Got captions list:`, JSON.stringify(data).slice(0, 300));
      
      // Find English caption
      const captions = data.captions || [];
      const englishCaption = captions.find((c: any) => 
        c.language_code === 'en' || 
        c.languageCode === 'en' ||
        c.language_code?.startsWith('en') ||
        c.languageCode?.startsWith('en') ||
        c.label?.toLowerCase().includes('english')
      );
      
      if (!englishCaption) {
        console.log(`[Invidious] No English caption found at ${instance}`);
        continue;
      }
      
      // Try to get the caption content with different formats
      const label = englishCaption.label || englishCaption.name;
      const langCode = englishCaption.language_code || englishCaption.languageCode || 'en';
      
      // Try VTT format first (more reliable)
      const captionUrls = [
        `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(label)}&format=vtt`,
        `${instance}/api/v1/captions/${videoId}?lang=${langCode}&format=vtt`,
        `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(label)}`,
        englishCaption.url?.startsWith('http') ? englishCaption.url : `${instance}${englishCaption.url}`,
      ];
      
      for (const captionUrl of captionUrls) {
        if (!captionUrl) continue;
        
        try {
          console.log(`[Invidious] Trying caption URL: ${captionUrl}`);
          
          const captionResponse = await fetch(captionUrl, {
            headers: {
              'Accept': 'text/vtt, application/xml, text/xml, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!captionResponse.ok) {
            console.log(`[Invidious] Caption URL returned ${captionResponse.status}`);
            continue;
          }
          
          const captionText = await captionResponse.text();
          console.log(`[Invidious] Got caption text, length: ${captionText.length}, preview: ${captionText.slice(0, 100)}`);
          
          if (captionText.length < 50) continue;
          
          // Try to parse as VTT
          if (captionText.includes('WEBVTT') || captionText.includes('-->')) {
            const segments = parseVttTranscript(captionText);
            if (segments.length > 0) {
              console.log(`[Invidious] Parsed ${segments.length} segments from VTT`);
              return segments;
            }
          }
          
          // Try to parse as XML
          if (captionText.includes('<text') || captionText.includes('<?xml')) {
            const segments = parseXmlTranscript(captionText);
            if (segments.length > 0) {
              console.log(`[Invidious] Parsed ${segments.length} segments from XML`);
              return segments;
            }
          }
          
        } catch (e: any) {
          console.log(`[Invidious] Caption URL failed: ${e.message}`);
        }
      }
      
    } catch (e: any) {
      console.log(`[Invidious] ${instance} failed:`, e.message);
      continue;
    }
  }
  return null;
}

// Fetch transcript using YouTube's Innertube API with different client types
async function fetchFromInnertube(videoId: string): Promise<SubtitleSegment[] | null> {
  // Try different client types - some have better caption access
  const clientConfigs = [
    {
      clientName: 'WEB',
      clientVersion: '2.20231219.04.00',
    },
    {
      clientName: 'ANDROID',
      clientVersion: '19.09.37',
      androidSdkVersion: 30,
    },
    {
      clientName: 'IOS',
      clientVersion: '19.09.3',
    }
  ];
  
  for (const clientConfig of clientConfigs) {
    try {
      console.log(`[Innertube] Trying client: ${clientConfig.clientName}`);
      
      const response = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/',
        },
        body: JSON.stringify({
          context: {
            client: {
              ...clientConfig,
              hl: 'en',
              gl: 'US',
            }
          },
          videoId: videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        })
      });

      if (!response.ok) {
        console.log(`[Innertube] ${clientConfig.clientName} returned ${response.status}`);
        continue;
      }

      const playerData = await response.json();
      
      // Check for captions
      const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captionTracks || captionTracks.length === 0) {
        console.log(`[Innertube] ${clientConfig.clientName}: No caption tracks`);
        continue;
      }
      
      console.log(`[Innertube] ${clientConfig.clientName}: Found ${captionTracks.length} caption tracks`);
      
      // Find English track
      const englishTrack = 
        captionTracks.find((t: any) => t.languageCode === 'en' && t.kind !== 'asr') ||
        captionTracks.find((t: any) => t.languageCode === 'en') ||
        captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
        captionTracks.find((t: any) => t.name?.simpleText?.toLowerCase().includes('english'));
      
      if (!englishTrack?.baseUrl) {
        console.log(`[Innertube] No English track with baseUrl`);
        continue;
      }
      
      console.log(`[Innertube] Using track: ${englishTrack.name?.simpleText || englishTrack.languageCode}`);
      
      // Fetch the transcript XML
      const xmlResponse = await fetch(englishTrack.baseUrl);
      if (!xmlResponse.ok) {
        console.log(`[Innertube] XML fetch returned ${xmlResponse.status}`);
        continue;
      }
      
      const xmlText = await xmlResponse.text();
      console.log(`[Innertube] Got XML, length: ${xmlText.length}`);
      
      const segments = parseXmlTranscript(xmlText);
      if (segments.length > 0) {
        console.log(`[Innertube] Parsed ${segments.length} segments`);
        return segments;
      }
      
    } catch (e: any) {
      console.error(`[Innertube] ${clientConfig.clientName} failed:`, e.message);
    }
  }
  
  return null;
}

// Fetch transcript by scraping YouTube page - improved regex patterns
async function fetchFromYouTubeScrape(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    console.log(`[YT-Scrape] Fetching page for ${videoId}`);
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESHAgBEhJnd3NfMjAyMzEyMTAtMF9SQzEaAmVuIAEaBgiA_LyqBg',
      }
    });
    
    const html = await response.text();
    console.log(`[YT-Scrape] Got HTML, length: ${html.length}`);
    
    // Try multiple patterns to extract caption tracks
    let captionTracks: any[] | null = null;
    
    // Pattern 1: Look for captionTracks in the script data
    const patterns = [
      /"captionTracks"\s*:\s*(\[(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*\])/,
      /captionTracks"\s*:\s*(\[.*?\])\s*,\s*"audioTracks/s,
      /captionTracks"\s*:\s*(\[.*?\])\s*,\s*"translationLanguages/s,
      /"playerCaptionsTracklistRenderer"\s*:\s*\{[^}]*"captionTracks"\s*:\s*(\[.*?\])/s,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          // Clean up and parse the JSON
          let jsonStr = match[1];
          // Handle escaped quotes
          jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          captionTracks = JSON.parse(jsonStr);
          console.log(`[YT-Scrape] Found ${captionTracks?.length} tracks via pattern`);
          break;
        } catch (e) {
          console.log(`[YT-Scrape] Pattern parse failed: ${e}`);
        }
      }
    }
    
    // Pattern 2: Look for ytInitialPlayerResponse
    if (!captionTracks) {
      const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
      if (playerMatch) {
        try {
          // Find the end of the JSON object
          let depth = 0;
          let endIndex = 0;
          const str = playerMatch[1];
          for (let i = 0; i < str.length; i++) {
            if (str[i] === '{') depth++;
            if (str[i] === '}') depth--;
            if (depth === 0) {
              endIndex = i + 1;
              break;
            }
          }
          const playerData = JSON.parse(str.substring(0, endIndex));
          captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (captionTracks) {
            console.log(`[YT-Scrape] Found ${captionTracks.length} tracks via ytInitialPlayerResponse`);
          }
        } catch (e) {
          console.log(`[YT-Scrape] ytInitialPlayerResponse parse failed: ${e}`);
        }
      }
    }
    
    // Pattern 3: Look directly for baseUrl with caption format
    if (!captionTracks) {
      const baseUrlMatch = html.match(/"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
      if (baseUrlMatch) {
        console.log(`[YT-Scrape] Found direct baseUrl`);
        const baseUrl = baseUrlMatch[1].replace(/\\u0026/g, '&');
        
        const xmlResponse = await fetch(baseUrl);
        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          const segments = parseXmlTranscript(xmlText);
          if (segments.length > 0) {
            console.log(`[YT-Scrape] Parsed ${segments.length} segments from direct baseUrl`);
            return segments;
          }
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
    
    // Decode the baseUrl (may have unicode escapes)
    const baseUrl = englishTrack.baseUrl.replace(/\\u0026/g, '&');
    console.log(`[YT-Scrape] Fetching XML from: ${baseUrl.slice(0, 100)}...`);
    
    const xmlResponse = await fetch(baseUrl);
    const xmlText = await xmlResponse.text();
    
    const segments = parseXmlTranscript(xmlText);
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
    
    // Method 1: Try youtube-transcript library
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
    
    // Method 2: Try YouTube Innertube API
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
    
    // Method 4: Try Invidious API
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
