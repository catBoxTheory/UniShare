"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Clock, PlayCircle, Trash2, Folder, FolderPlus, ChevronLeft, ChevronRight, Pencil,
  Youtube, Link, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveYouTubeVideo } from "@/app/actions/materials";
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

// Helper functions
const isYouTubeUrl = (url: string) => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

const getYouTubeVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  return match ? match[1] : "";
};

const getYouTubeThumbnail = (url: string) => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
};

export function VideoZone({ courseId, initialVideos = [] }: VideoZoneProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<VideoFolder | null>(null);
  const [folderPath, setFolderPath] = useState<VideoFolder[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<VideoFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
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

  // YouTube URL input
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);

  // Drag and drop
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Only load if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Create YouTube player when video changes
  useEffect(() => {
    if (!currentVideo || !mounted) return;

    const videoId = getYouTubeVideoId(currentVideo.url);
    if (!videoId) return;

    const initPlayer = () => {
      // Destroy previous player if exists
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }

      ytPlayerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            // 0 = ended
            if (event.data === 0 && isAutoplayEnabled) {
              playNextVideo();
            }
          },
        },
      });
    };

    // Wait for YT API to be ready
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [currentVideo, mounted, isAutoplayEnabled, playNextVideo]);

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
  };

  const playNextVideo = useCallback(() => {
    if (!currentVideo || videos.length <= 1) return;
    
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      setCurrentVideo(nextVideo);
    }
  }, [currentVideo, videos]);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Fetch YouTube metadata when URL is pasted
  const handleYoutubeUrlChange = async (url: string) => {
    setYoutubeUrl(url);
    setYoutubeTitle("");

    if (!url.trim()) return;

    // Basic YouTube URL validation
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      return;
    }

    setIsFetchingMetadata(true);
    try {
      const response = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        setYoutubeTitle(data.title || "");
      }
    } catch (error) {
      console.error("Failed to fetch YouTube metadata:", error);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // Add YouTube video
  const handleAddYoutubeVideo = async () => {
    if (!youtubeUrl.trim() || !youtubeTitle.trim()) return;

    setIsAddingYoutube(true);
    try {
      const result = await saveYouTubeVideo({
        title: youtubeTitle,
        youtubeUrl: youtubeUrl,
        courseId,
        folderId: currentFolderId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setYoutubeUrl("");
      setYoutubeTitle("");
      await refreshContent();
    } catch (error: any) {
      console.error("Failed to add YouTube video:", error);
      alert(`Failed to add video: ${error.message}`);
    } finally {
      setIsAddingYoutube(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    setDraggedItemId(videoId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", videoId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData("text/plain");
    
    if (!fileId || fileId === targetFolderId) {
      setDraggedItemId(null);
      setDragOverFolderId(null);
      return;
    }

    try {
      const response = await fetch("/api/files/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, targetFolderId }),
      });

      if (!response.ok) throw new Error("Move failed");
      await refreshContent();
    } catch (error) {
      console.error("Move error:", error);
      alert("Failed to move video. Please try again.");
    } finally {
      setDraggedItemId(null);
      setDragOverFolderId(null);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto items-start min-h-0">
      {/* Main Video Player */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-xl overflow-hidden shadow-lg h-fit">
        {/* Video Container - Enforce 16:9 Aspect Ratio */}
        <div ref={playerContainerRef} className="relative aspect-video bg-black group flex-shrink-0">
          {currentVideo && mounted ? (
            // YouTube Video - Container for YouTube IFrame API
            <div 
              key={currentVideo.id}
              id="youtube-player"
              className="w-full h-full"
            />
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
      <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-[600px] max-h-[80vh] min-h-0">
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
        <div className="flex-1 overflow-y-auto min-h-0">
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
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 group transition-all",
                        dragOverFolderId === folder.id && "bg-blue-100 border-2 border-dashed border-blue-400 scale-[1.02]"
                      )}
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
                      draggable
                      onDragStart={(e) => handleDragStart(e, video.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleVideoSelect(video)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startVideoEdit(video);
                      }}
                      className={cn(
                        "flex gap-3 p-2 rounded-lg cursor-pointer transition-all group",
                        currentVideo?.id === video.id
                          ? "bg-blue-100 border border-blue-300"
                          : "hover:bg-gray-100",
                        draggedItemId === video.id && "opacity-50 scale-95"
                      )}
                    >
                      <div className="relative w-16 h-10 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {isYouTubeUrl(video.url) ? (
                          <>
                            <img 
                              src={getYouTubeThumbnail(video.url) || ""} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0.5 left-0.5">
                              <Youtube className="w-3 h-3 text-red-500 bg-white rounded-sm" />
                            </div>
                          </>
                        ) : (
                          <video 
                            src={getProxyUrl(video.url) + "#t=1.0"} 
                            className="w-full h-full object-cover" 
                            preload="metadata"
                          />
                        )}
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

        {/* YouTube URL Input */}
        <div className="p-3 border-t bg-gray-50 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Youtube className="w-4 h-4 text-red-500" />
            Add YouTube Video
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Paste YouTube URL..."
                value={youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                className="pr-8"
              />
              {isFetchingMetadata && (
                <Loader2 className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>
            {youtubeUrl && (
              <Input
                placeholder="Video title"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
              />
            )}
            <Button
              className="w-full"
              size="sm"
              onClick={handleAddYoutubeVideo}
              disabled={isAddingYoutube || !youtubeUrl.trim() || !youtubeTitle.trim()}
            >
              <Link className="w-4 h-4 mr-2" />
              {isAddingYoutube ? "Adding..." : "Add Video"}
            </Button>
          </div>
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
