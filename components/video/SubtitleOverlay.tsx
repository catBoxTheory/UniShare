"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SubtitleSegment {
    start: number;
    end: number;
    text: string;
}

interface SubtitleOverlayProps {
    segments: SubtitleSegment[];
    currentTime: number;
    isVisible?: boolean;
    className?: string;
}

export function SubtitleOverlay({
    segments,
    currentTime,
    isVisible = true,
    className
}: SubtitleOverlayProps) {
    const [activeSegment, setActiveSegment] = useState<SubtitleSegment | null>(null);

    useEffect(() => {
        if (!segments || segments.length === 0) {
            setActiveSegment(null);
            return;
        }

        // Find the segment that covers the current time
        const currentSegment = segments.find(
            (seg) => currentTime >= seg.start && currentTime <= seg.end
        );

        setActiveSegment(currentSegment || null);
    }, [currentTime, segments]);

    if (!isVisible || !activeSegment) return null;

    return (
        <div className={cn(
            "absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-10",
            className
        )}>
            <div className="bg-black/60 px-4 py-2 rounded text-white text-center max-w-[80%] shadow-lg backdrop-blur-sm border border-white/10">
                <p className="text-lg md:text-xl font-medium leading-tight whitespace-pre-wrap">
                    {activeSegment.text}
                </p>
            </div>
        </div>
    );
}
