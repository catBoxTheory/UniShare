"use client";

import { useEffect, useRef, useCallback } from "react";

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

export function YouTubePlayer({ videoId, autoPlay = false, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);

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

  const initializePlayer = useCallback(() => {
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
        },
        events: {
          'onStateChange': onPlayerStateChange,
        }
      });
    } catch (e) {
      console.error('Failed to initialize YouTube player:', e);
    }
  }, [videoId, autoPlay]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === 0 && onEnded) {
      onEnded();
    }
  }, [onEnded]);

  return (
    <div className="relative w-full h-full group bg-black overflow-hidden">
      {/* YouTube Player Container */}
      <div id={`youtube-player-${videoId}`} className="w-full h-full" />
    </div>
  );
}
