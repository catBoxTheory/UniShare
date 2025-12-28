"use server";

import prisma from "@/lib/prisma";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface TranscriptItem {
  offset: number;
  duration: number;
  text: string;
}

interface SubtitleItem {
  start: number;
  end: number;
  text_en: string;
  text_zh: string;
}

export async function generateBilingualSubtitles(materialId: string) {
  try {
    // 1. Retrieve Material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material || !material.url) {
      throw new Error("Material not found or missing URL");
    }

    // 2. Extract Video ID
    // Support standard youtube.com/watch?v=VIDEO_ID and youtu.be/VIDEO_ID
    const videoIdMatch = material.url.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // 3. Fetch Transcript
    // youtube-transcript returns { offset, duration, text }
    let rawTranscript: TranscriptItem[] = [];
    try {
      rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (error) {
      console.error("YoutubeTranscript error:", error);
      throw new Error("Could not fetch transcript from YouTube. The video might not have captions enabled.");
    }

    if (!rawTranscript || rawTranscript.length === 0) {
      throw new Error("No transcript available for this video.");
    }

    // 4. Batch Processing
    const CHUNK_SIZE = 50;
    const finalSubtitles: SubtitleItem[] = [];

    // Process chunks sequentially to avoid rate limits or overwhelming the model
    for (let i = 0; i < rawTranscript.length; i += CHUNK_SIZE) {
      const chunk = rawTranscript.slice(i, i + CHUNK_SIZE);
      
      const systemPrompt = `You are a professional translator. You will receive a JSON array of English subtitles. Return a JSON array of the exact same length where the 'text' field is translated to Simplified Chinese. Do not change offsets or durations. Output ONLY valid JSON.`;
      
      const userPrompt = JSON.stringify(chunk);

      try {
        const response = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" }, // DeepSeek supports JSON mode? If not, we parse manually.
          // Note: DeepSeek API documentation says it supports JSON output if instructed, 
          // but strict "json_object" mode might depend on their specific API version/compatibility.
          // For safety with generic OpenAI client, we can rely on the system prompt instruction.
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("Empty response from AI model");
        }

        // Parse response
        // Sometimes models wrap JSON in markdown code blocks like ```json ... ```
        const jsonMatch = content.match(/\[.*\]/s) || content.match(/\{.*\}/s); 
        // We expect an array, but if the model returns { "subtitles": [...] } or similar, we need to handle it.
        // The prompt asks for a JSON array.
        
        let translatedChunk: TranscriptItem[] = [];
        
        try {
            // Attempt to parse the whole content first
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                translatedChunk = parsed;
            } else if (parsed && Array.isArray(parsed.subtitles)) {
                 translatedChunk = parsed.subtitles;
            } else {
                 // Try to find array in the text
                 const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
                 if (arrayMatch) {
                     translatedChunk = JSON.parse(arrayMatch[0]);
                 } else {
                     throw new Error("Could not parse JSON array from response");
                 }
            }
        } catch (e) {
            // Fallback: try removing markdown
            const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
            translatedChunk = JSON.parse(cleanContent);
        }

        if (!Array.isArray(translatedChunk)) {
             throw new Error("AI response is not an array");
        }

        // 5. Merge
        if (translatedChunk.length !== chunk.length) {
            console.warn(`Chunk length mismatch: Expected ${chunk.length}, got ${translatedChunk.length}. Aligning by index.`);
        }

        const mergedChunk: SubtitleItem[] = chunk.map((item, index) => {
            const translatedItem = translatedChunk[index];
            const translatedText = translatedItem ? translatedItem.text : "";
            
            return {
                start: item.offset,
                end: item.offset + item.duration,
                text_en: item.text,
                text_zh: translatedText
            };
        });

        finalSubtitles.push(...mergedChunk);

      } catch (err) {
        console.error(`Error translating chunk starting at index ${i}:`, err);
        // Fallback: use empty Chinese text for this chunk so we don't lose the English ones? 
        // Or fail the whole process? The user wants reliability.
        // Let's add the English ones with empty Chinese translation as fallback.
        const fallbackChunk: SubtitleItem[] = chunk.map(item => ({
            start: item.offset,
            end: item.offset + item.duration,
            text_en: item.text,
            text_zh: "[Translation Failed]"
        }));
        finalSubtitles.push(...fallbackChunk);
      }
    }

    // 6. Save
    await prisma.material.update({
      where: { id: materialId },
      data: {
        videoSubtitles: finalSubtitles as any, // Cast to any for Json type if needed, or rely on Prisma type inference
      },
    });

    revalidatePath(`/courses/${material.courseId}`);
    return { success: true };

  } catch (error: any) {
    console.error("generateBilingualSubtitles error:", error);
    return { success: false, error: error.message };
  }
}

