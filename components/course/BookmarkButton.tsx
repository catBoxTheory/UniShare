"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/app/actions/bookmarks";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  materialId: string;
  initialSaved: boolean;
}

export function BookmarkButton({ materialId, initialSaved }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleBookmark(materialId);
      if (result.success) {
        setSaved(result.saved);
      }
    });
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
      disabled={isPending}
      className={cn(
        "p-1 rounded-md transition-colors",
        saved
          ? "text-emerald-500 hover:text-emerald-600"
          : "text-muted-foreground/40 hover:text-emerald-500"
      )}
      aria-label={saved ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark className={cn("h-4 w-4 transition-all", saved && "fill-emerald-500")} />
    </button>
  );
}
