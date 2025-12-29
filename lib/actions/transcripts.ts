"use server";

import { AssemblyAI, TranscriptUtterance } from "assemblyai";

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
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
 * Convert YouTube video ID to full URL
 */
function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Transcribe YouTube video using AssemblyAI
 * AssemblyAI can directly accept YouTube URLs and handle the audio extraction
 */
async function transcribeWithAssemblyAI(youtubeUrl: string): Promise<SubtitleSegment[]> {
  console.log(`[Transcribe] Sending YouTube URL to AssemblyAI: ${youtubeUrl}`);
  
  // Create transcription with speaker labels for better segmentation
  const transcript = await assemblyai.transcripts.transcribe({
    audio_url: youtubeUrl,
    language_code: "en", // Assuming English audio
  });
  
  if (transcript.status === "error") {
    throw new Error(transcript.error || "Transcription failed");
  }
  
  console.log(`[Transcribe] AssemblyAI transcription complete`);
  
  // Parse words into segments (group by sentences/pauses)
  const segments: SubtitleSegment[] = [];
  
  if (transcript.words && transcript.words.length > 0) {
    // Group words into subtitle segments (roughly 5-10 seconds each)
    let currentSegment: SubtitleSegment | null = null;
    const MAX_SEGMENT_DURATION = 7000; // 7 seconds in ms
    const MAX_WORDS_PER_SEGMENT = 15;
    let wordCount = 0;
    
    for (const word of transcript.words) {
      if (!currentSegment) {
        currentSegment = {
          start: word.start / 1000, // Convert ms to seconds
          end: word.end / 1000,
          text: word.text,
        };
        wordCount = 1;
      } else {
        const segmentDuration = word.end - (currentSegment.start * 1000);
        
        // Check if we should start a new segment
        if (
          segmentDuration > MAX_SEGMENT_DURATION ||
          wordCount >= MAX_WORDS_PER_SEGMENT ||
          word.text.match(/[.!?]$/) // End of sentence
        ) {
          // Add punctuation to current segment if word ends with it
          if (word.text.match(/[.!?]$/)) {
            currentSegment.text += " " + word.text;
            currentSegment.end = word.end / 1000;
          }
          
          segments.push(currentSegment);
          
          // Start new segment (skip if current word was end of sentence)
          if (!word.text.match(/[.!?]$/)) {
            currentSegment = {
              start: word.start / 1000,
              end: word.end / 1000,
              text: word.text,
            };
            wordCount = 1;
          } else {
            currentSegment = null;
            wordCount = 0;
          }
        } else {
          // Add word to current segment
          currentSegment.text += " " + word.text;
          currentSegment.end = word.end / 1000;
          wordCount++;
        }
      }
    }
    
    // Add remaining segment
    if (currentSegment && currentSegment.text.trim()) {
      segments.push(currentSegment);
    }
  } else if (transcript.text) {
    // Fallback: single segment with full text
    segments.push({
      start: 0,
      end: 0,
      text: transcript.text,
    });
  }
  
  console.log(`[Transcribe] Created ${segments.length} subtitle segments`);
  
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
 * Uses AssemblyAI which can directly process YouTube URLs
 */
export async function transcribeAudioFromYoutube(
  videoIdOrUrl: string,
  translateToChinese: boolean = true
): Promise<TranscriptionResult> {
  try {
    // Check if AssemblyAI is configured
    if (!process.env.ASSEMBLYAI_API_KEY) {
      return {
        success: false,
        error: "AssemblyAI API key not configured",
      };
    }
    
    // Extract video ID and build URL
    const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    
    if (!videoId || videoId.length !== 11) {
      return {
        success: false,
        error: "Invalid YouTube video ID or URL",
      };
    }
    
    const youtubeUrl = getYouTubeUrl(videoId);
    console.log(`[Transcribe] Starting transcription for video: ${videoId}`);
    
    // Step 1: Transcribe with AssemblyAI
    const englishSubtitles = await transcribeWithAssemblyAI(youtubeUrl);
    
    if (englishSubtitles.length === 0) {
      return {
        success: false,
        error: "Transcription produced no results",
      };
    }
    
    // Step 2: Translate to Chinese (optional)
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
  }
}

/**
 * Check if transcription service is available
 */
export async function isTranscriptionAvailable(): Promise<boolean> {
  return !!process.env.ASSEMBLYAI_API_KEY;
}
