"use client";

import { MaterialType } from "@prisma/client";

const typeConfig: Record<MaterialType, { label: string; className: string }> = {
  LECTURE: { label: "Lecture", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  EXTRA: { label: "Extra", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  FILE: { label: "File", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  VIDEO: { label: "Video", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

export function MaterialTypeBadge({ type }: { type: MaterialType }) {
  const config = typeConfig[type] || typeConfig.FILE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
