import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export const dynamic = 'force-dynamic';

// Simple cache to avoid re-translating the same text
const translationCache = new Map<string, string>();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return NextResponse.json({ translated: "" });
    }

    // Check cache first
    if (translationCache.has(trimmedText)) {
      return NextResponse.json({ translated: translationCache.get(trimmedText) });
    }

    // Translate
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "Translate the following English text to Traditional Chinese (繁體中文). Only output the translation, nothing else." 
        },
        { role: "user", content: trimmedText }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const translated = completion.choices[0].message.content?.trim() || "";
    
    // Cache the result (limit cache size)
    if (translationCache.size > 1000) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(trimmedText, translated);

    return NextResponse.json({ translated });

  } catch (error: any) {
    console.error("[Translate-Single] Error:", error);
    return NextResponse.json({ 
      error: "Translation failed", 
      details: error.message 
    }, { status: 500 });
  }
}

