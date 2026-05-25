"use client";

import { useState, useEffect } from "react";
import { Folder as FolderIcon, FileText, Upload, Plus, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createFolder } from "@/app/actions/folders";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResourceUploadForm } from "@/components/upload/ResourceUploadForm";
import { Modal } from "@/components/ui/modal";

interface FileExplorerProps {
  courseId: string;
  initialContents: {
    folders: any[];
    files: any[];
  };
  initialFolderId?: string;
  breadcrumbs?: any[];
}

export function FileExplorer({ 
  courseId, 
  initialContents,
  initialFolderId,
  breadcrumbs = []
}: FileExplorerProps) {
  const router = useRouter();
  const [contents, setContents] = useState(initialContents);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(initialFolderId);
  const [path, setPath] = useState<any[]>(breadcrumbs);
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);

  // Sync state if props change (e.g. navigation)
  useEffect(() => {
    setContents(initialContents);
    setCurrentFolderId(initialFolderId);
    setPath(breadcrumbs);
  }, [initialContents, initialFolderId, breadcrumbs]);

  async function handleCreateFolder() {
    if (!newFolderName) return;
    const result = await createFolder(newFolderName, courseId, currentFolderId);
    if (result.success) {
      setContents(prev => ({
        ...prev,
        folders: [...prev.folders, result.data]
      }));
      setNewFolderName("");
      setIsNewFolderOpen(false);
      router.refresh(); // Ensure server is in sync
    }
  }

  function handleFolderClick(folderId: string) {
    // Navigate to the folder view
    router.push(`/courses/${courseId}?folderId=${folderId}`);
  }

  function handleFileClick(file: any) {
    if (file.type === 'VIDEO') {
        router.push(`/courses/${courseId}/watch?fileId=${file.id}`);
    } else {
        // Handle PDF/other downloads
        window.open(file.url, '_blank');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-muted-foreground overflow-hidden">
           <Link href={`/courses/${courseId}`} className="hover:text-foreground transition-colors font-medium">
              Root
            </Link>
            {path.map((folder) => (
              <div key={folder.id} className="flex items-center">
                 <ChevronRight className="h-4 w-4 mx-1" />
                 <Link href={`/courses/${courseId}?folderId=${folder.id}`} className="hover:text-foreground transition-colors">
                    {folder.name}
                 </Link>
              </div>
            ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Input 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                />
                <Button onClick={handleCreateFolder}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Modal
            title="Upload File"
            trigger={
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Here
              </Button>
            }
          >
            <ResourceUploadForm courseId={courseId} folderId={currentFolderId} />
          </Modal>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Folders */}
        {contents.folders.map((folder) => (
          <div 
            key={folder.id}
            onClick={() => handleFolderClick(folder.id)}
            className="group flex flex-col items-center p-4 rounded-lg border bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer transition-colors"
          >
            <FolderIcon className="h-12 w-12 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-center line-clamp-2 w-full truncate">
              {folder.name}
            </span>
          </div>
        ))}

        {/* Files */}
        {contents.files.map((file) => (
          <div 
            key={file.id}
            onClick={() => handleFileClick(file)}
            className="group flex flex-col items-center p-4 rounded-lg border hover:shadow-md cursor-pointer transition-all bg-white"
          >
            <div className="relative mb-2">
                {file.type === 'VIDEO' ? (
                    <PlayCircle className="h-10 w-10 text-slate-400" />
                ) : (
                    <FileText className="h-10 w-10 text-slate-400" />
                )}
            </div>
            <span className="text-sm text-center line-clamp-2 w-full break-words text-slate-700">
              {file.title}
            </span>
          </div>
        ))}

        {contents.folders.length === 0 && contents.files.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
                This folder is empty.
            </div>
        )}
      </div>
    </div>
  );
}

