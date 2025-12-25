"use client"

import React, { useState, useEffect } from 'react';
import { Play, FileText, Upload } from 'lucide-react';
import { cn } from "@/lib/utils";
import ReactPlayer from 'react-player';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ResourceUploadForm } from "@/components/upload/ResourceUploadForm";

interface VideoItemProps {
  id: string;
  title: string;
  isActive?: boolean;
}

const VideoItem = ({ id, title, isActive }: VideoItemProps) => (
  <div 
    className={cn(
    "flex gap-3 p-3 rounded-md cursor-pointer hover:bg-slate-100 transition-colors",
    isActive && "bg-slate-100 border-l-4 border-blue-500"
  )}>
    <div className="relative w-24 h-16 bg-slate-200 flex-shrink-0 rounded overflow-hidden flex items-center justify-center">
        <Play className="w-6 h-6 text-slate-400" />
    </div>
    <div className="flex flex-col justify-center overflow-hidden">
      <h4 className="font-medium text-sm line-clamp-2 leading-tight">{title}</h4>
    </div>
  </div>
);

export function CourseVideoPlayer({ 
    video, 
    relatedVideos, 
    courseId 
}: { 
    video: any, 
    relatedVideos: any[], 
    courseId: string 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!video) return <div>Video not found</div>;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
      {/* Main Video Player Area */}
      <div className="lg:col-span-3">
        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative shadow-sm flex items-center justify-center">
            {mounted && ReactPlayer.canPlay(video.url) ? (
               <ReactPlayer 
                  url={video.url} 
                  width="100%" 
                  height="100%" 
                  controls 
                  playing
               />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                    {mounted ? (
                        <>
                            <FileText className="w-16 h-16 opacity-50 mb-2" />
                            <p>This file format cannot be played in the browser.</p>
                            <a 
                                href={video.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Download File
                            </a>
                        </>
                    ) : (
                        <div className="animate-pulse w-full h-full bg-slate-800" />
                    )}
                </div>
            )}
        </div>
        <div className="mt-4">
            <h2 className="text-xl font-bold">{video.title}</h2>
            <p className="text-slate-500 text-sm mt-1">Posted on {new Date(video.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Playlist Sidebar */}
      <div className="lg:col-span-1 flex flex-col h-[600px] border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Folder
            </h3>
            <Modal
                title="Upload Here"
                trigger={
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Upload className="h-4 w-4" />
                    </Button>
                }
            >
                {/* Upload to the same folder as the current video */}
                <ResourceUploadForm courseId={courseId} folderId={video.folderId} />
            </Modal>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {relatedVideos.map((v) => (
            <Link key={v.id} href={`/courses/${courseId}/watch?fileId=${v.id}`}>
                <VideoItem
                  id={v.id}
                  title={v.title}
                  isActive={v.id === video.id}
                />
            </Link>
          ))}
          {relatedVideos.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                  No other videos in this folder.
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
