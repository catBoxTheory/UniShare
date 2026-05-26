"use client";

import { Trophy, Library } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  departmentName: string;
  materialCount: number;
  enrollmentCount: number;
}

export function Leaderboard({ data }: { data: LeaderboardEntry[] }) {
  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-emerald-500" />
        <h3 className="text-base font-bold text-foreground">Top Courses</h3>
      </div>
      <div className="space-y-1">
        {data.slice(0, 5).map((entry) => (
          <Link
            key={entry.courseId}
            href={`/courses/${entry.courseId}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <span className={`w-6 text-center text-sm font-bold tabular-nums ${
              entry.rank === 1 ? "text-amber-500" :
              entry.rank === 2 ? "text-slate-400" :
              entry.rank === 3 ? "text-amber-700" :
              "text-muted-foreground"
            }`}>
              {entry.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-600 transition-colors">
                {entry.courseTitle}
              </p>
              <p className="text-xs text-muted-foreground">{entry.courseCode}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Library className="h-3 w-3" />
                {entry.materialCount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
