"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Subtitles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BilingualSubtitle {
  start: number;
  duration: number;
  textEn: string;
  textZh: string;
}

interface SubtitleSegment {
  text: string;
  start: number;
  duration: number;
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Piped API instances to try
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.yt",
  "https://pipedapi.r4fo.com",
];

// Helper to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Client-side: Fetch transcript from Piped API
async function fetchTranscriptFromPiped(videoId: string): Promise<SubtitleSegment[] | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`[Client] Trying Piped: ${instance}`);
      
      // Get video info which includes subtitles
      const response = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        console.log(`[Client] ${instance} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      // Find English subtitles
      const subtitles = data.subtitles || [];
      const englishSub = subtitles.find((s: any) => 
        s.code === 'en' || 
        s.code?.startsWith('en') ||
        s.name?.toLowerCase().includes('english')
      );
      
      if (!englishSub?.url) {
        console.log(`[Client] No English subtitles at ${instance}`);
        continue;
      }
      
      console.log(`[Client] Found subtitle URL: ${englishSub.url}`);
      
      // Fetch the subtitle content
      const subResponse = await fetch(englishSub.url, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (!subResponse.ok) continue;
      
      const subText = await subResponse.text();
      console.log(`[Client] Got subtitle text, length: ${subText.length}`);
      
      // Parse VTT format
      const segments: SubtitleSegment[] = [];
      const cues = subText.split(/\n\n+/);
      
      for (const cue of cues) {
        const timestampMatch = cue.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        if (timestampMatch) {
          const startMs = (parseInt(timestampMatch[1]) * 3600 + parseInt(timestampMatch[2]) * 60 + parseInt(timestampMatch[3])) * 1000 + parseInt(timestampMatch[4]);
          const endMs = (parseInt(timestampMatch[5]) * 3600 + parseInt(timestampMatch[6]) * 60 + parseInt(timestampMatch[7])) * 1000 + parseInt(timestampMatch[8]);
          
          const lines = cue.split('\n');
          const textLines = lines.slice(lines.findIndex(l => l.includes('-->')) + 1);
          const text = decodeHtmlEntities(textLines.join(' ').replace(/<[^>]*>/g, '').trim());
          
          if (text) {
            segments.push({
              text,
              start: startMs,
              duration: endMs - startMs
            });
          }
        }
      }
      
      if (segments.length > 0) {
        console.log(`[Client] Parsed ${segments.length} segments from Piped`);
        return segments;
      }
      
    } catch (e: any) {
      console.log(`[Client] Piped ${instance} failed:`, e.message);
    }
  }
  
  return null;
}

// Client-side: Try to fetch from YouTube directly via cors-anywhere or similar
async function fetchTranscriptDirect(videoId: string): Promise<SubtitleSegment[] | null> {
  try {
    // Try fetching via our proxy API which will attempt server-side methods
    const response = await fetch(`/api/youtube/transcript?videoId=${videoId}&clientFallback=true`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.subtitles && data.subtitles.length > 0) {
        // Already translated, return as-is
        return null; // Signal to use the full bilingual data
      }
    }
  } catch (e) {
    console.log('[Client] Direct fetch failed:', e);
  }
  
  return null;
}

export function YouTubePlayer({ videoId, title, autoPlay = false, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [subtitles, setSubtitles] = useState<BilingualSubtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<BilingualSubtitle | null>(null);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [hasTranscriptError, setHasTranscriptError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId]);

  // Fetch subtitles when videoId changes
  useEffect(() => {
    const fetchSubtitles = async () => {
      setIsLoadingSubtitles(true);
      setHasTranscriptError(false);
      setSubtitles([]);
      setCurrentSubtitle(null);

      try {
        // Step 1: Try to get transcript from Piped API (client-side)
        console.log(`[Client] Fetching subtitles for ${videoId}`);
        const segments = await fetchTranscriptFromPiped(videoId);
        
        if (segments && segments.length > 0) {
          console.log(`[Client] Got ${segments.length} segments, sending for translation`);
          
          // Step 2: Send to server for translation only
          const translateResponse = await fetch('/api/youtube/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              segments: segments.slice(0, 100) // Limit to first 100 for performance
            })
          });
          
          if (!translateResponse.ok) {
            throw new Error('Translation failed');
          }
          
          const translated = await translateResponse.json();
          setSubtitles(translated.subtitles);
          console.log(`[Client] Got ${translated.subtitles.length} translated subtitles`);
          return;
        }
        
        // Step 3: Fallback to server-side methods
        console.log(`[Client] Piped failed, trying server-side methods`);
        const response = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404 && errorData.code === "NO_TRANSCRIPT") {
            throw new Error("No subtitles available");
          }
          throw new Error("Failed to load subtitles");
        }
        
        const data = await response.json();
        if (data.subtitles) {
          setSubtitles(data.subtitles);
        }
        
      } catch (error: any) {
        console.error("Subtitle fetch error:", error);
        setHasTranscriptError(true);
        setErrorMessage(error.message || "Subtitles unavailable");
      } finally {
        setIsLoadingSubtitles(false);
      }
    };

    if (videoId) {
      fetchSubtitles();
    }
  }, [videoId, retryCount]);

  // Sync subtitles with video time
  useEffect(() => {
    if (!showSubtitles || subtitles.length === 0) {
      setCurrentSubtitle(null);
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime();
          const sub = subtitles.find(s => 
            time >= (s.start / 1000) && 
            time < ((s.start + s.duration) / 1000)
          );
          setCurrentSubtitle(sub || null);
        } catch (e) {}
      }
    }, 100);

    return () => clearInterval(interval);
  }, [subtitles, showSubtitles]);

  const initializePlayer = () => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById(`youtube-player-${videoId}`)) return;

    try {
      playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    } catch (e) {
      console.error('Failed to initialize YouTube player:', e);
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 0 && onEnded) {
      onEnded();
    }
  };

  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full group bg-black overflow-hidden">
      {/* YouTube Player Container */}
      <div id={`youtube-player-${videoId}`} className="w-full h-full" />

      {/* Subtitle Overlay */}
      {showSubtitles && currentSubtitle && (
        <div className="absolute bottom-16 left-0 right-0 p-4 text-center pointer-events-none z-10">
          <div className="inline-block bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-w-[90%] md:max-w-[70%] space-y-1">
            <p className="text-white text-base md:text-lg font-medium leading-tight shadow-sm">
              {currentSubtitle.textEn}
            </p>
            <p className="text-yellow-300 text-sm md:text-base font-normal leading-tight">
              {currentSubtitle.textZh}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-md",
            showSubtitles && !hasTranscriptError && "text-blue-400"
          )}
          onClick={toggleSubtitles}
          disabled={isLoadingSubtitles}
        >
          {isLoadingSubtitles ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Subtitles className="w-4 h-4 mr-1.5" />
          )}
          {isLoadingSubtitles ? "載入中..." : (showSubtitles ? "AI 字幕" : "AI 字幕關")}
        </Button>
        
        {hasTranscriptError && (
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-md"
            onClick={retryFetch}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Error Toast */}
      {hasTranscriptError && showSubtitles && (
        <div className="absolute top-4 left-4 z-20 bg-black/60 text-white text-xs px-3 py-1.5 rounded backdrop-blur-md border border-white/10">
          {errorMessage === "No subtitles available" 
            ? "無字幕可用 (No subtitles available)" 
            : `翻譯錯誤: ${errorMessage}`}
        </div>
      )}
    </div>
  );
}
