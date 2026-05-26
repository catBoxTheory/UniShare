"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { rateMaterial } from "@/app/actions/ratings";
import { cn } from "@/lib/utils";

interface MaterialRatingProps {
  materialId: string;
  initialRating: number | null;
  avgRating: number;
  totalRatings: number;
}

export function MaterialRating({
  materialId,
  initialRating,
  avgRating,
  totalRatings,
}: MaterialRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(initialRating || 0);
  const [localAvg, setLocalAvg] = useState(avgRating);
  const [localCount, setLocalCount] = useState(totalRatings);

  async function handleClick(star: number) {
    const result = await rateMaterial(materialId, star);
    if (result.success && result.data) {
      setSelectedRating(star);
      setLocalAvg(result.data.avgRating);
      setLocalCount(result.data.totalRatings);
    }
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => handleClick(star)}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                star <= (hoveredStar || selectedRating)
                  ? "fill-emerald-500 text-emerald-500"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {localCount > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {localAvg} ({localCount})
        </span>
      )}
    </div>
  );
}
