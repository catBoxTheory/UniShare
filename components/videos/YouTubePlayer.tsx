"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Subtitles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BilingualSubtitle {
  start: number;
  duration: number;
  textEn: string;
  textZh: string;
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
  const [loadingStatus, setLoadingStatus] = useState("");

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
      setLoadingStatus("正在獲取字幕...");

      try {
        // Step 1: Try Piped API via our proxy (avoids CORS issues)
        console.log(`[Client] Fetching subtitles for ${videoId} via Piped proxy`);
        setLoadingStatus("嘗試 Piped API...");
        
        const pipedResponse = await fetch(`/api/youtube/piped?videoId=${videoId}`);
        
        if (pipedResponse.ok) {
          const pipedData = await pipedResponse.json();
          
          if (pipedData.segments && pipedData.segments.length > 0) {
            console.log(`[Client] Got ${pipedData.segments.length} segments from Piped, translating...`);
            setLoadingStatus("正在翻譯...");
            
            // Step 2: Send to server for translation
            const translateResponse = await fetch('/api/youtube/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                segments: pipedData.segments.slice(0, 100)
              })
            });
            
            if (translateResponse.ok) {
              const translated = await translateResponse.json();
              setSubtitles(translated.subtitles);
              console.log(`[Client] Got ${translated.subtitles.length} translated subtitles`);
              setLoadingStatus("");
              return;
            }
          }
        }
        
        // Step 3: Fallback to original transcript API
        console.log(`[Client] Piped failed, trying original transcript API`);
        setLoadingStatus("嘗試其他方法...");
        
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
        setLoadingStatus("");
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

      {/* Loading Status */}
      {isLoadingSubtitles && loadingStatus && (
        <div className="absolute bottom-16 left-0 right-0 p-4 text-center pointer-events-none z-10">
          <div className="inline-block bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingStatus}
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
            showSubtitles && !hasTranscriptError && subtitles.length > 0 && "text-blue-400"
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
            title="重試"
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
            : `錯誤: ${errorMessage}`}
        </div>
      )}
    </div>
  );
}
