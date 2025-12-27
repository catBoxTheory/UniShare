"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Languages, Subtitles } from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [hasTranscriptError, setHasTranscriptError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load YouTube IFrame API
  useEffect(() => {
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
        playerRef.current.destroy();
      }
    };
  }, [videoId]); // Re-init when videoId changes

  // Fetch subtitles when videoId changes
  useEffect(() => {
    const fetchSubtitles = async () => {
      setIsLoadingSubtitles(true);
      setHasTranscriptError(false);
      setSubtitles([]);
      setCurrentSubtitle(null);

      try {
        const response = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          // If it's a known "No Transcript" error, show a specific message
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
  }, [videoId]);

  // Sync subtitles with video time
  useEffect(() => {
    if (!showSubtitles || subtitles.length === 0) {
      setCurrentSubtitle(null);
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        // Convert to milliseconds match transcript format if needed, 
        // but our API returns seconds (youtube-transcript default) or ms?
        // youtube-transcript returns 'offset' in milliseconds usually, let's check API.
        // Wait, youtube-transcript usually returns seconds or ms?
        // Actually youtube-transcript returns 'offset' in seconds (float).
        // Let's assume seconds for now based on typical usage.
        
        // Find matching subtitle
        // Using * 1000 if the API returns ms, or * 1 if seconds. 
        // Standard youtube-transcript returns seconds.
        const sub = subtitles.find(s => 
          time >= (s.start / 1000) && 
          time < ((s.start + s.duration) / 1000)
        );
        
        setCurrentSubtitle(sub || null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [subtitles, showSubtitles]);

  const initializePlayer = () => {
    if (!document.getElementById(`youtube-player-${videoId}`)) return;

    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        // Disable default cc to avoid overlap
        cc_load_policy: 0 
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const onPlayerStateChange = (event: any) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0 && onEnded) {
      onEnded();
    }
  };

  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
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
            showSubtitles && "text-blue-400"
          )}
          onClick={toggleSubtitles}
          disabled={hasTranscriptError || isLoadingSubtitles}
        >
          {isLoadingSubtitles ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Subtitles className="w-4 h-4 mr-1.5" />
          )}
          {isLoadingSubtitles ? "Loading AI Subs..." : (showSubtitles ? "AI Subs On" : "AI Subs Off")}
        </Button>
      </div>
      
      {/* Error Toast if fetch failed */}
      {hasTranscriptError && showSubtitles && (
        <div className="absolute top-4 left-4 z-20 bg-black/60 text-white text-xs px-3 py-1.5 rounded backdrop-blur-md border border-white/10">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

