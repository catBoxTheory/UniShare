"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleEnrollment } from "@/app/actions/courses"
import { BookmarkPlus, BookmarkMinus, BookmarkCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LibraryToggleButtonProps {
  courseId: string
  initialEnrolled: boolean
  minimal?: boolean
  className?: string
}

export function LibraryToggleButton({ courseId, initialEnrolled, minimal = false, className }: LibraryToggleButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation if used inside a clickable card
    startTransition(async () => {
      const result = await toggleEnrollment(courseId)
      if (result.success) {
        setIsEnrolled(result.enrolled ?? !isEnrolled)
      }
    })
  }

  if (minimal) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "h-8 w-8 bg-white/90 hover:bg-white shadow-sm transition-colors",
          isEnrolled ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-blue-600",
          className
        )}
        title={isEnrolled ? "Remove from Library" : "Add to Library"}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEnrolled ? (
          <BookmarkMinus className="w-4 h-4" />
        ) : (
          <BookmarkPlus className="w-4 h-4" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={isEnrolled ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        isEnrolled ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-blue-600 hover:bg-blue-700",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isEnrolled ? (
        <BookmarkMinus className="w-4 h-4 mr-2" />
      ) : (
        <BookmarkPlus className="w-4 h-4 mr-2" />
      )}
      {isEnrolled ? "In Library" : "Add to Library"}
    </Button>
  )
}
