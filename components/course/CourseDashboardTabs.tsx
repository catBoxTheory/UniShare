"use client";

import { useState } from "react";
import { FileText, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentZone } from "@/components/documents/DocumentZone";
import { VideoZone } from "@/components/videos/VideoZone";

interface Document {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

interface CourseDashboardTabsProps {
  courseId: string;
  initialDocuments: Document[];
  initialVideos: Video[];
  defaultTab?: "documents" | "videos";
}

export function CourseDashboardTabs({
  courseId,
  initialDocuments,
  initialVideos,
  defaultTab = "documents",
}: CourseDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"documents" | "videos">(defaultTab);

  const tabs = [
    {
      id: "documents" as const,
      label: "Documents",
      icon: FileText,
      count: initialDocuments.length,
    },
    {
      id: "videos" as const,
      label: "Videos",
      icon: Video,
      count: initialVideos.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "documents" && (
          <DocumentZone courseId={courseId} initialDocuments={initialDocuments} />
        )}
        {activeTab === "videos" && (
          <VideoZone courseId={courseId} initialVideos={initialVideos} />
        )}
      </div>
    </div>
  );
}

