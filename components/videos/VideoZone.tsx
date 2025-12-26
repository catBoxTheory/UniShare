"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Upload, Clock, 
  PlayCircle, Trash2, Folder, FolderPlus, ChevronLeft, ChevronRight, Settings, Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveMaterialToDb } from "@/app/actions/materials";
import { MaterialType } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Video {
  id: string;
  title: string;
  url: string;
  folderId?: string | null;
  createdAt: Date;
}

interface VideoFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

interface VideoZoneProps {
  courseId: string;
  initialVideos?: Video[];
}

// Memoized Controls Component to prevent flickering
interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeekMouseDown: () => void;
  onSeekMouseUp: () => void;
}

const VideoControls = memo(({
  isPlaying,
  isMuted,
  progress,
  duration,
  playbackRate,
  isFullscreen,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onPlaybackRateChange,
  onSeekChange,
  onSeekMouseDown,
  onSeekMouseUp
}: VideoControlsProps) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end px-4 pb-3 pt-12",
      "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
      "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
      !isPlaying && "opacity-100" // Keep visible when paused
    )}>
      {/* Progress Bar Container */}
      <div className="group/progress relative h-1.5 hover:h-2.5 w-full cursor-pointer mb-3 transition-all">
        {/* Background Track */}
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 rounded-full"></div>
        
        {/* Play Progress */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-red-600 rounded-full"
          style={{ width: `${progress}%` }}
        >
           {/* Scrubber Knob (visible on hover) */}
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform"></div>
        </div>

        {/* Input Range (Invisible but interactive) */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={onSeekChange}
          onMouseDown={onSeekMouseDown}
          onMouseUp={onSeekMouseUp}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPlayPause} 
            className="text-white hover:bg-white/10 hover:text-white w-10 h-10"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
          </Button>
          
          <div className="flex items-center group/volume">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMuteToggle} 
              className="text-white hover:bg-white/10 hover:text-white w-10 h-10"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>
          </div>

          <span className="text-sm font-medium text-white ml-2">
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white w-10 h-10">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent disablePortal align="end" className="bg-black/90 border-gray-800 text-white">
              <DropdownMenuItem onClick={() => onPlaybackRateChange(0.5)}>0.5x</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlaybackRateChange(1.0)}>1.0x (Normal)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlaybackRateChange(1.25)}>1.25x</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlaybackRateChange(1.5)}>1.5x</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlaybackRateChange(2.0)}>2.0x</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onFullscreenToggle} 
            className="text-white hover:bg-white/10 hover:text-white w-10 h-10"
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

VideoControls.displayName = "VideoControls";

export function VideoZone({ courseId, initialVideos = [] }: VideoZoneProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<VideoFolder | null>(null);
  const [folderPath, setFolderPath] = useState<VideoFolder[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<VideoFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [volume, setVolume] = useState(1);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Rename state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: "folder" | "video"; id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Inline editing
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    refreshContent();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    refreshContent();
  }, [currentFolderId]);

  // Auto-play when video changes
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      // Small timeout to ensure video element is ready
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentVideo]);

  const refreshContent = async () => {
    try {
      const folderParam = currentFolderId ? `&folderId=${currentFolderId}` : "";
      const response = await fetch(`/api/videos?courseId=${courseId}${folderParam}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        setFolders(data.folders || []);
        setCurrentFolder(data.currentFolder || null);
        
        // Build folder path for breadcrumbs
        if (data.currentFolder) {
          await buildFolderPath(data.currentFolder);
        } else {
          setFolderPath([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    }
  };

  const buildFolderPath = async (folder: VideoFolder) => {
    const path: VideoFolder[] = [folder];
    let currentParentId = folder.parentId;
    
    while (currentParentId) {
      try {
        const response = await fetch(`/api/videos?courseId=${courseId}&folderId=${currentParentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentFolder) {
            path.unshift(data.currentFolder);
            currentParentId = data.currentFolder.parentId;
          } else {
            break;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    
    setFolderPath(path);
  };

  const handleVideoSelect = (video: Video) => {
    if (editingVideoId === video.id) return;
    setCurrentVideo(video);
    setProgress(0);
    // isPlaying is set in the useEffect
  };

  const handleFolderClick = (folder: VideoFolder) => {
    if (editingFolderId === folder.id) return;
    setCurrentFolderId(folder.id);
  };

  const handleGoBack = () => {
    if (currentFolder?.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else {
      setCurrentFolderId(null);
    }
  };

  // Optimize state updates to avoid excessive re-renders
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isNaN(currentProgress) ? 0 : currentProgress);
    }
  }, [isSeeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = volume;
    }
  }, [playbackRate, volume]);

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    if (videoRef.current) {
      videoRef.current.currentTime = (value / 100) * duration;
    }
  }, [duration]);

  const handleSeekMouseDown = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSeekMouseUp = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        // Fallback for iOS
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file (MP4, WebM, etc.)");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get Presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "video/mp4",
        }),
      });

      if (!presignedRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await presignedRes.json();

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "video/mp4",
        },
      });

      if (!uploadRes.ok) throw new Error("Cloud upload failed");

      // 3. Save to Database
      const dbRes = await saveMaterialToDb({
        title: file.name,
        url: publicUrl,
        type: MaterialType.VIDEO,
        courseId,
        folderId: currentFolderId,
      });

      if (!dbRes.success) throw new Error(dbRes.error);

      await refreshContent();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload video: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getProxyUrl = (originalUrl: string) => {
    try {
      if (originalUrl.startsWith("/")) return originalUrl;
      const url = new URL(originalUrl);
      if (url.port === "9000") {
        return `/api/proxy${url.pathname}`;
      }
      return originalUrl;
    } catch (e) {
      return originalUrl;
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          courseId,
          parentId: currentFolderId,
          type: "VIDEO",
        }),
      });

      if (!response.ok) throw new Error("Failed to create folder");

      setNewFolderDialogOpen(false);
      setNewFolderName("");
      await refreshContent();
    } catch (error) {
      console.error("Create folder error:", error);
      alert("Failed to create folder. Please try again.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteVideoClick = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    setVideoToDelete(video);
    setFolderToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFolderClick = (e: React.MouseEvent, folder: VideoFolder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setVideoToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (videoToDelete) {
        const response = await fetch(`/api/files/${videoToDelete.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Delete failed");

        if (currentVideo?.id === videoToDelete.id) {
          const remainingVideos = videos.filter(v => v.id !== videoToDelete.id);
          setCurrentVideo(remainingVideos[0] || null);
        }
      } else if (folderToDelete) {
        const response = await fetch(`/api/folders?folderId=${folderToDelete.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Delete failed");
      }

      await refreshContent();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      setFolderToDelete(null);
    }
  };

  // Rename handlers
  const handleRenameFolder = (folder: VideoFolder) => {
    setRenameTarget({ type: "folder", id: folder.id, name: folder.name });
    setNewName(folder.name);
    setRenameDialogOpen(true);
  };

  const handleRenameVideo = (video: Video) => {
    setRenameTarget({ type: "video", id: video.id, name: video.title });
    setNewName(video.title);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!renameTarget || !newName.trim()) return;

    setIsRenaming(true);
    try {
      if (renameTarget.type === "folder") {
        const response = await fetch("/api/folders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: renameTarget.id, name: newName.trim() }),
        });
        if (!response.ok) throw new Error("Rename failed");
      } else {
        const response = await fetch(`/api/files/${renameTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newName.trim() }),
        });
        if (!response.ok) throw new Error("Rename failed");
      }

      await refreshContent();
      setRenameDialogOpen(false);
      setRenameTarget(null);
      setNewName("");
    } catch (error) {
      console.error("Rename error:", error);
      alert("Failed to rename. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Inline editing handlers
  const startFolderEdit = (folder: VideoFolder) => {
    setEditingFolderId(folder.id);
    setEditValue(folder.name);
  };

  const startVideoEdit = (video: Video) => {
    setEditingVideoId(video.id);
    setEditValue(video.title);
  };

  const handleInlineSave = async (type: "folder" | "video", id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    try {
      if (type === "folder") {
        const folder = folders.find(f => f.id === id);
        if (folder && folder.name === trimmed) {
          cancelEdit();
          return;
        }
        const response = await fetch("/api/folders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: id, name: trimmed }),
        });
        if (!response.ok) throw new Error("Rename failed");
      } else {
        const video = videos.find(v => v.id === id);
        if (video && video.title === trimmed) {
          cancelEdit();
          return;
        }
        const response = await fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        if (!response.ok) throw new Error("Rename failed");
      }
      await refreshContent();
    } catch (error) {
      console.error("Rename error:", error);
    } finally {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setEditingFolderId(null);
    setEditingVideoId(null);
    setEditValue("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto items-start">
      {/* Main Video Player */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-xl overflow-hidden shadow-lg h-fit">
        {/* Video Container - Enforce 16:9 Aspect Ratio */}
        <div ref={playerContainerRef} className="relative aspect-video bg-black group flex-shrink-0">
          {currentVideo && mounted ? (
            <>
              <video
                ref={videoRef}
                key={currentVideo.id}
                src={getProxyUrl(currentVideo.url)}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => console.error("Video error:", e)}
                playsInline
                preload="metadata"
                onClick={togglePlay} // Click video to play/pause
              />
              
              {/* Center Play Button (Only when paused and hovered) */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                      <Play className="w-12 h-12 text-white fill-white" />
                   </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              <VideoControls 
                isPlaying={isPlaying}
                isMuted={isMuted}
                progress={progress}
                duration={duration}
                playbackRate={playbackRate}
                isFullscreen={isFullscreen}
                onPlayPause={togglePlay}
                onMuteToggle={toggleMute}
                onFullscreenToggle={toggleFullscreen}
                onPlaybackRateChange={changePlaybackRate}
                onSeekChange={handleSeekChange}
                onSeekMouseDown={handleSeekMouseDown}
                onSeekMouseUp={handleSeekMouseUp}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <PlayCircle className="w-20 h-20 mb-4 opacity-50" />
              <p>Select a video from the playlist</p>
            </div>
          )}
        </div>

        {/* Video Title and Info (Outside player in normal mode) */}
        {currentVideo && !isFullscreen && (
          <div className="bg-white p-4 border-t">
            <h2 className="text-xl font-bold text-gray-900">{currentVideo.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(currentVideo.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Playlist Sidebar with Folders */}
      <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-[600px]">
        {/* Playlist Header with Breadcrumbs */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            {currentFolderId ? (
              <Button variant="ghost" size="sm" onClick={handleGoBack} className="h-8 px-2">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <h3 className="font-semibold text-gray-800">Playlist</h3>
            )}
            <Button variant="ghost" size="sm" onClick={() => setNewFolderDialogOpen(true)} className="h-8 px-2">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Breadcrumb path */}
          {folderPath.length > 0 && (
            <div className="flex items-center text-xs text-gray-500 overflow-x-auto">
              <button 
                onClick={() => setCurrentFolderId(null)} 
                className="hover:text-blue-600 whitespace-nowrap"
              >
                Home
              </button>
              {folderPath.map((folder, index) => (
                <span key={folder.id} className="flex items-center">
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <button
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={cn(
                      "hover:text-blue-600 whitespace-nowrap",
                      index === folderPath.length - 1 && "font-medium text-gray-700"
                    )}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Folders and Videos List */}
        <div className="flex-1 overflow-y-auto">
          {folders.length === 0 && videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-gray-400">
              <PlayCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm text-center">
                {currentFolderId ? "This folder is empty" : "No videos uploaded yet"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Folders first */}
              {folders.map((folder) => (
                <ContextMenu key={folder.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => handleFolderClick(folder)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startFolderEdit(folder);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <Folder className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingFolderId === folder.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineSave("folder", folder.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineSave("folder", folder.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-7 text-sm"
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
                            <p className="text-xs text-gray-500">Folder</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameFolder(folder);
                          }}
                          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteFolderClick(e, folder)}
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRenameFolder(folder)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                      onClick={() => {
                        setFolderToDelete(folder);
                        setVideoToDelete(null);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {/* Videos */}
              {videos.map((video, index) => (
                <ContextMenu key={video.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => handleVideoSelect(video)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startVideoEdit(video);
                      }}
                      className={cn(
                        "flex gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
                        currentVideo?.id === video.id
                          ? "bg-blue-100 border border-blue-300"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <div className="relative w-16 h-10 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <video 
                          src={getProxyUrl(video.url) + "#t=1.0"} 
                          className="w-full h-full object-cover" 
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                           {currentVideo?.id === video.id ? (
                             <div className="w-full h-full bg-blue-500/20 animate-pulse"></div>
                           ) : null}
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/70 text-white px-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {editingVideoId === video.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineSave("video", video.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineSave("video", video.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-7 text-sm"
                          />
                        ) : (
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                            {video.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameVideo(video);
                          }}
                          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteVideoClick(e, video)}
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRenameVideo(video)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                      onClick={() => {
                        setVideoToDelete(video);
                        setFolderToDelete(null);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="p-3 border-t bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="video-upload"
          />
          <Button
            className="w-full"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize your videos into chapters or categories.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name (e.g., Chapter 1)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
              {isCreatingFolder ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type === "folder" ? "Folder" : "Video"}</DialogTitle>
            <DialogDescription>
              Enter a new name for this {renameTarget?.type}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRename} disabled={isRenaming || !newName.trim()}>
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {videoToDelete ? "Video" : "Folder"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {videoToDelete
                ? `Are you sure you want to delete "${videoToDelete.title}"? This action cannot be undone.`
                : `Are you sure you want to delete folder "${folderToDelete?.name}"? This will also delete all videos and subfolders inside.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
