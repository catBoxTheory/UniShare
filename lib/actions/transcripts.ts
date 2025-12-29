"use server";

import Groq from "groq-sdk";
import ytdl from "@distube/ytdl-core";
import { Readable } from "stream";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
 * Create YouTube agent with cookies for authentication
 */
function createYouTubeAgent() {
  const cookiesJson = process.env.YOUTUBE_COOKIES_JSON;
  if (!cookiesJson) {
    console.warn("[Transcribe] No YouTube cookies configured, downloads may fail");
    return undefined;
  }
  
  try {
    const cookies = JSON.parse(cookiesJson);
    console.log(`[Transcribe] Creating YouTube agent with ${cookies.length} cookies`);
    return ytdl.createAgent(cookies);
  } catch (e) {
    console.error("[Transcribe] Failed to parse YouTube cookies:", e);
    return undefined;
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Download audio from YouTube video
 */
async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Create temp directory if it doesn't exist
  const tempDir = join(tmpdir(), "unistream-audio");
  await mkdir(tempDir, { recursive: true });
  
  const tempFilePath = join(tempDir, `${randomUUID()}.mp3`);
  
  console.log(`[Transcribe] Downloading audio for video: ${videoId}`);
  
  // Create agent with cookies for authentication
  const agent = createYouTubeAgent();
  
  // Get audio stream with authentication
  const audioStream = ytdl(url, {
    filter: "audioonly",
    quality: "lowestaudio", // Use lowest quality for faster download
    agent: agent,
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    }
  });
  
  // Convert stream to buffer
  const audioBuffer = await streamToBuffer(audioStream);
  
  // Write to temp file
  await writeFile(tempFilePath, audioBuffer);
  
  console.log(`[Transcribe] Audio downloaded to: ${tempFilePath}`);
  
  return tempFilePath;
}

/**
 * Transcribe audio file using Groq Whisper
 */
async function transcribeWithGroq(audioFilePath: string): Promise<SubtitleSegment[]> {
  console.log(`[Transcribe] Sending audio to Groq Whisper...`);
  
  const { createReadStream } = await import("fs");
  const audioFile = createReadStream(audioFilePath);
  
  // Use Groq's Whisper API with verbose_json for timestamps
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3", // or "distil-whisper-large-v3-en" for English-only
    response_format: "verbose_json",
    language: "en", // Assuming English audio
  });
  
  console.log(`[Transcribe] Transcription complete`);
  
  // Parse the response - verbose_json includes segments with timestamps
  const segments: SubtitleSegment[] = [];
  
  if (transcription && typeof transcription === "object" && "segments" in transcription) {
    const rawSegments = (transcription as any).segments || [];
    for (const seg of rawSegments) {
      segments.push({
        start: seg.start || 0,
        end: seg.end || 0,
        text: (seg.text || "").trim(),
      });
    }
  } else if (transcription && typeof transcription === "object" && "text" in transcription) {
    // Fallback if no segments - create single segment
    segments.push({
      start: 0,
      end: 0,
      text: (transcription as any).text || "",
    });
  }
  
  return segments;
}

/**
 * Translate English subtitles to Chinese using DeepSeek
 */
async function translateToChineseWithDeepSeek(
  englishSegments: SubtitleSegment[]
): Promise<SubtitleSegment[]> {
  if (!DEEPSEEK_API_KEY) {
    console.warn("[Transcribe] DeepSeek API key not configured, skipping translation");
    return [];
  }
  
  console.log(`[Transcribe] Translating ${englishSegments.length} segments to Chinese...`);
  
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
        console.error(`[Transcribe] DeepSeek translation failed: ${response.status}`);
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
      console.error(`[Transcribe] Translation batch error:`, error);
      // Add original segments as fallback
      for (const seg of batch) {
        chineseSegments.push({ ...seg });
      }
    }
  }
  
  console.log(`[Transcribe] Translation complete`);
  
  return chineseSegments;
}

/**
 * Main function: Transcribe YouTube video audio and optionally translate
 */
export async function transcribeAudioFromYoutube(
  videoIdOrUrl: string,
  translateToChinese: boolean = true
): Promise<TranscriptionResult> {
  let tempFilePath: string | null = null;
  
  try {
    // Extract video ID
    const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    
    if (!videoId || videoId.length !== 11) {
      return {
        success: false,
        error: "Invalid YouTube video ID or URL",
      };
    }
    
    console.log(`[Transcribe] Starting transcription for video: ${videoId}`);
    
    // Step 1: Download audio
    tempFilePath = await downloadYouTubeAudio(videoId);
    
    // Step 2: Transcribe with Groq Whisper
    const englishSubtitles = await transcribeWithGroq(tempFilePath);
    
    if (englishSubtitles.length === 0) {
      return {
        success: false,
        error: "Transcription produced no results",
      };
    }
    
    // Step 3: Translate to Chinese (optional)
    let chineseSubtitles: SubtitleSegment[] = [];
    if (translateToChinese) {
      chineseSubtitles = await translateToChineseWithDeepSeek(englishSubtitles);
    }
    
    console.log(`[Transcribe] Successfully transcribed ${englishSubtitles.length} segments`);
    
    return {
      success: true,
      englishSubtitles,
      chineseSubtitles,
    };
  } catch (error) {
    console.error(`[Transcribe] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log(`[Transcribe] Cleaned up temp file`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if Groq API is configured
 */
export async function isTranscriptionAvailable(): Promise<boolean> {
  return !!process.env.GROQ_API_KEY;
}

