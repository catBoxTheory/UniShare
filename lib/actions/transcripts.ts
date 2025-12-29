"use server";

import { YoutubeTranscript } from "youtube-transcript";

// API Keys
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const AUDIO_SERVICE_URL = process.env.AUDIO_SERVICE_URL; // Python microservice URL (Railway)
const AUDIO_SERVICE_API_KEY = process.env.AUDIO_SERVICE_API_KEY;

// Invidious instances for fallback
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.jing.rocks",
  "https://vid.puffyan.us",
  "https://invidious.privacydev.net",
];

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  success: boolean;
  englishSubtitles?: SubtitleSegment[];
  chineseSubtitles?: SubtitleSegment[];
  error?: string;
  noSubtitles?: boolean;
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch captions using Invidious API (fallback method)
 */
async function fetchFromInvidious(videoId: string): Promise<SubtitleSegment[]> {
  console.log(`[Subtitles] Trying Invidious API for: ${videoId}`);
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      // First, get the list of available captions
      const videoResponse = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!videoResponse.ok) continue;
      
      const videoData = await videoResponse.json();
      const captions = videoData.captions || [];
      
      // Find English captions (prefer manual over auto-generated)
      let captionUrl = null;
      for (const cap of captions) {
        if (cap.language_code === 'en' || cap.language_code?.startsWith('en')) {
          captionUrl = cap.url;
          if (!cap.label?.includes('auto')) break; // Prefer manual captions
        }
      }
      
      // If no English, try first available
      if (!captionUrl && captions.length > 0) {
        captionUrl = captions[0].url;
      }
      
      if (!captionUrl) {
        console.log(`[Subtitles] No captions found on ${instance}`);
        continue;
      }
      
      // Fetch the actual captions
      const fullCaptionUrl = captionUrl.startsWith('http') ? captionUrl : `${instance}${captionUrl}`;
      const captionResponse = await fetch(fullCaptionUrl, {
        signal: AbortSignal.timeout(10000),
      });
      
      if (!captionResponse.ok) continue;
      
      const captionText = await captionResponse.text();
      
      // Parse VTT format
      const segments = parseVTT(captionText);
      
      if (segments.length > 0) {
        console.log(`[Subtitles] Successfully fetched ${segments.length} segments from ${instance}`);
        return segments;
      }
    } catch (error: any) {
      console.log(`[Subtitles] Invidious instance ${instance} failed:`, error.message);
      continue;
    }
  }
  
  return [];
}

/**
 * Parse VTT subtitle format
 */
function parseVTT(vttContent: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const lines = vttContent.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for timestamp lines (00:00:00.000 --> 00:00:00.000)
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    
    if (timestampMatch) {
      const start = parseTimestamp(timestampMatch[1]);
      const end = parseTimestamp(timestampMatch[2]);
      
      // Collect text lines until empty line
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        // Remove VTT tags like <c> </c>
        const cleanLine = lines[i].replace(/<[^>]*>/g, '').trim();
        if (cleanLine) {
          text += (text ? ' ' : '') + cleanLine;
        }
        i++;
      }
      
      if (text) {
        segments.push({ start, end, text });
      }
    }
    i++;
  }
  
  return segments;
}

/**
 * Parse VTT timestamp to seconds
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch YouTube captions using youtube-transcript library
 */
async function fetchYouTubeCaptions(videoId: string): Promise<SubtitleSegment[]> {
  console.log(`[Subtitles] Fetching captions for video: ${videoId}`);
  
  // Method 1: Try youtube-transcript library
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    
    if (transcript && transcript.length > 0) {
      console.log(`[Subtitles] Found ${transcript.length} caption segments via youtube-transcript`);
      return transcript.map((item) => ({
        start: item.offset / 1000,
        end: (item.offset + item.duration) / 1000,
        text: item.text.replace(/\n/g, " ").trim(),
      }));
    }
  } catch (error: any) {
    console.log(`[Subtitles] youtube-transcript failed:`, error.message);
  }
  
  // Method 2: Try Invidious API as fallback
  try {
    const invidiousResult = await fetchFromInvidious(videoId);
    if (invidiousResult.length > 0) {
      return invidiousResult;
    }
  } catch (error: any) {
    console.log(`[Subtitles] Invidious fallback failed:`, error.message);
  }
  
  return [];
}

/**
 * Full pipeline: Download audio, transcribe, and translate using Python microservice
 * This runs entirely on Railway to avoid Vercel timeout limits
 */
async function transcribeWithAudioService(videoId: string): Promise<{
  englishSubtitles: SubtitleSegment[];
  chineseSubtitles: SubtitleSegment[];
} | null> {
  if (!AUDIO_SERVICE_URL || !AUDIO_SERVICE_API_KEY) {
    console.log("[Subtitles] Audio service not configured, skipping AI transcription");
    return null;
  }
  
  console.log(`[Subtitles] Using AI transcription service for video: ${videoId}`);
  
  try {
    // Call the /transcribe endpoint which handles everything on Railway
    console.log("[Subtitles] Calling transcription service...");
    const response = await fetch(`${AUDIO_SERVICE_URL}/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUDIO_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        translateToChinese: true,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Transcription failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Transcription failed");
    }
    
    console.log(`[Subtitles] AI transcription complete: ${data.englishSubtitles?.length || 0} segments`);
    
    return {
      englishSubtitles: data.englishSubtitles || [],
      chineseSubtitles: data.chineseSubtitles || [],
    };
  } catch (error: any) {
    console.error("[Subtitles] AI transcription error:", error.message);
    return null;
  }
}

/**
 * Translate English subtitles to Chinese using DeepSeek
 */
async function translateToChineseWithDeepSeek(
  englishSegments: SubtitleSegment[]
): Promise<SubtitleSegment[]> {
  if (!DEEPSEEK_API_KEY) {
    console.warn("[Subtitles] DeepSeek API key not configured, skipping translation");
    return [];
  }
  
  console.log(`[Subtitles] Translating ${englishSegments.length} segments to Chinese...`);
  
  // Batch translate - combine segments for efficiency
  const batchSize = 20;
  const chineseSegments: SubtitleSegment[] = [];
  
  for (let i = 0; i < englishSegments.length; i += batchSize) {
    const batch = englishSegments.slice(i, i + batchSize);
    const textsToTranslate = batch.map((seg, idx) => `[${idx}] ${seg.text}`).join("\n");
    
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator. Translate the following English subtitles to Traditional Chinese (繁體中文). Keep the [number] prefix for each line. Only output the translations, no explanations.",
            },
            {
              role: "user",
              content: textsToTranslate,
            },
          ],
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) {
        console.error(`[Subtitles] DeepSeek translation failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content || "";
      
      // Parse translated lines
      const translatedLines = translatedText.split("\n").filter((line: string) => line.trim());
      
      for (let j = 0; j < batch.length; j++) {
        const originalSegment = batch[j];
        // Try to find matching translation by index
        const translatedLine = translatedLines.find((line: string) =>
          line.startsWith(`[${j}]`)
        );
        
        chineseSegments.push({
          start: originalSegment.start,
          end: originalSegment.end,
          text: translatedLine
            ? translatedLine.replace(/^\[\d+\]\s*/, "").trim()
            : originalSegment.text, // Fallback to original if translation not found
        });
      }
    } catch (error) {
      console.error(`[Subtitles] Translation batch error:`, error);
      // Add original segments as fallback
      for (const seg of batch) {
        chineseSegments.push({ ...seg });
      }
    }
  }
  
  console.log(`[Subtitles] Translation complete`);
  
  return chineseSegments;
}

/**
 * Main function: Fetch YouTube captions and optionally translate
 * Falls back to AI transcription if no captions available
 */
export async function fetchAndTranslateSubtitles(
  videoIdOrUrl: string,
  translateToChinese: boolean = true,
  useAIFallback: boolean = true
): Promise<TranscriptionResult> {
  try {
    // Extract video ID
    const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    
    if (!videoId || videoId.length !== 11) {
      return {
        success: false,
        error: "Invalid YouTube video ID or URL",
      };
    }
    
    console.log(`[Subtitles] Starting subtitle fetch for video: ${videoId}`);
    
    // Step 1: Try to fetch existing YouTube captions
    let englishSubtitles = await fetchYouTubeCaptions(videoId);
    let chineseSubtitles: SubtitleSegment[] = [];
    
    // Step 2: If no captions found and AI fallback is enabled, try AI transcription
    if (englishSubtitles.length === 0 && useAIFallback) {
      console.log(`[Subtitles] No captions found, trying AI transcription...`);
      const aiResult = await transcribeWithAudioService(videoId);
      
      if (aiResult) {
        // AI service returns both English and Chinese subtitles
        englishSubtitles = aiResult.englishSubtitles;
        chineseSubtitles = aiResult.chineseSubtitles;
      }
    }
    
    // If still no subtitles, return error
    if (englishSubtitles.length === 0) {
      const hasAudioService = !!AUDIO_SERVICE_URL && !!AUDIO_SERVICE_API_KEY;
      return {
        success: false,
        noSubtitles: true,
        error: hasAudioService
          ? "Failed to generate subtitles. The video may be unavailable or too long."
          : "This video does not have captions. AI transcription is not configured.",
      };
    }
    
    // Step 3: Translate to Chinese (optional)
    // Skip if we already have Chinese subtitles from AI service
    if (translateToChinese && chineseSubtitles.length === 0) {
      chineseSubtitles = await translateToChineseWithDeepSeek(englishSubtitles);
    }
    
    console.log(`[Subtitles] Successfully processed ${englishSubtitles.length} segments`);
    
    return {
      success: true,
      englishSubtitles,
      chineseSubtitles,
    };
  } catch (error) {
    console.error(`[Subtitles] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Keep backward compatibility with old function name
export async function transcribeAudioFromYoutube(
  videoIdOrUrl: string,
  translateToChinese: boolean = true
): Promise<TranscriptionResult> {
  return fetchAndTranslateSubtitles(videoIdOrUrl, translateToChinese);
}

/**
 * Check if AI transcription service is available (for videos without captions)
 * Now only checks for the audio service since Groq runs on Railway
 */
export async function isAITranscriptionAvailable(): Promise<boolean> {
  return !!(AUDIO_SERVICE_URL && AUDIO_SERVICE_API_KEY);
}

/**
 * Check if subtitle service is available
 * Always returns true since we can at least try to fetch YouTube captions
 */
export async function isTranscriptionAvailable(): Promise<boolean> {
  return true;
}
