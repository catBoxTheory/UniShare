"use server";

import { YoutubeTranscript } from "youtube-transcript";

// DeepSeek API for translation
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

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
 * Fetch YouTube captions using youtube-transcript library
 */
async function fetchYouTubeCaptions(videoId: string): Promise<SubtitleSegment[]> {
  console.log(`[Subtitles] Fetching captions for video: ${videoId}`);
  
  try {
    // Try to get English captions first, then any available
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    
    if (!transcript || transcript.length === 0) {
      console.log(`[Subtitles] No English captions, trying any language...`);
      const anyTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!anyTranscript || anyTranscript.length === 0) {
        return [];
      }
      
      return anyTranscript.map((item) => ({
        start: item.offset / 1000, // Convert ms to seconds
        end: (item.offset + item.duration) / 1000,
        text: item.text.replace(/\n/g, " ").trim(),
      }));
    }
    
    console.log(`[Subtitles] Found ${transcript.length} caption segments`);
    
    return transcript.map((item) => ({
      start: item.offset / 1000,
      end: (item.offset + item.duration) / 1000,
      text: item.text.replace(/\n/g, " ").trim(),
    }));
  } catch (error: any) {
    console.error(`[Subtitles] Error fetching captions:`, error.message);
    
    // Check if it's a "no captions" error
    if (
      error.message?.includes("Transcript is disabled") ||
      error.message?.includes("No transcript") ||
      error.message?.includes("Could not find")
    ) {
      return [];
    }
    
    throw error;
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
 */
export async function fetchAndTranslateSubtitles(
  videoIdOrUrl: string,
  translateToChinese: boolean = true
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
    
    // Step 1: Fetch YouTube captions
    const englishSubtitles = await fetchYouTubeCaptions(videoId);
    
    if (englishSubtitles.length === 0) {
      return {
        success: false,
        noSubtitles: true,
        error: "This video does not have captions available",
      };
    }
    
    // Step 2: Translate to Chinese (optional)
    let chineseSubtitles: SubtitleSegment[] = [];
    if (translateToChinese) {
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
 * Check if subtitle service is available
 * Always returns true since we're using public YouTube captions
 */
export async function isTranscriptionAvailable(): Promise<boolean> {
  return true; // YouTube captions are always available to fetch
}
