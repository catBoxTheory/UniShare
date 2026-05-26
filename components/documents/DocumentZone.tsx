"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FolderPlus, Folder, Trash2, FileText, Pencil, ArrowUpDown, Clock, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentPreview } from "./DocumentPreview";
import { MaterialRating } from "@/components/course/MaterialRating";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Document {
  id: string;
  title: string;
  url: string;
  folderId?: string | null;
  createdAt: Date;
  avgRating?: number;
  totalRatings?: number;
  userRating?: number | null;
}

interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

interface DocumentZoneProps {
  courseId: string;
  initialDocuments?: Document[];
}

function getFileIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (lower.endsWith('.ipynb')) {
    return <FileText className="w-5 h-5 text-orange-500" />;
  }
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
    return <FileText className="w-5 h-5 text-orange-600" />;
  }
  return <FileText className="w-5 h-5 text-gray-500" />;
}

function getFileType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.ipynb')) return 'Notebook';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PowerPoint';
  return 'Document';
}

export function DocumentZone({ courseId, initialDocuments = [] }: DocumentZoneProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DocFolder | null>(null);
  const [folderPath, setFolderPath] = useState<DocFolder[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sort, setSort] = useState<string>("name_asc");
  
  // Folder creation
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<DocFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: "folder" | "document"; id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Inline editing
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Drag and drop
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  useEffect(() => {
    refreshContent();
  }, [currentFolderId, sort]);

  const refreshContent = async () => {
    try {
      const folderParam = currentFolderId ? `&folderId=${currentFolderId}` : "";
      const sortParam = `&sort=${sort}`;
      const response = await fetch(`/api/documents?courseId=${courseId}${folderParam}${sortParam}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setFolders(data.folders || []);
        setCurrentFolder(data.currentFolder || null);
        
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

  const buildFolderPath = async (folder: DocFolder) => {
    const path: DocFolder[] = [folder];
    let currentParentId = folder.parentId;
    
    while (currentParentId) {
      try {
        const response = await fetch(`/api/documents?courseId=${courseId}&folderId=${currentParentId}`);
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

  const handleUploadComplete = () => {
    refreshContent();
  };

  const handleFolderClick = (folder: DocFolder) => {
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
          type: "DOCUMENT",
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

  const handleDeleteDocumentClick = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setFolderToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFolderClick = (e: React.MouseEvent, folder: DocFolder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setDocumentToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (documentToDelete) {
        const response = await fetch(`/api/files/${documentToDelete.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Delete failed");

        if (selectedDocument?.id === documentToDelete.id) {
          setSelectedDocument(null);
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
      setDocumentToDelete(null);
      setFolderToDelete(null);
    }
  };

  // Rename handlers
  const handleRenameFolder = (folder: DocFolder) => {
    setRenameTarget({ type: "folder", id: folder.id, name: folder.name });
    setNewName(folder.name);
    setRenameDialogOpen(true);
  };

  const handleRenameDocument = (doc: Document) => {
    setRenameTarget({ type: "document", id: doc.id, name: doc.title });
    setNewName(doc.title);
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
  const startFolderEdit = (folder: DocFolder) => {
    setEditingFolderId(folder.id);
    setEditValue(folder.name);
  };

  const startDocumentEdit = (doc: Document) => {
    setEditingDocumentId(doc.id);
    setEditValue(doc.title);
  };

  const handleInlineSave = async (type: "folder" | "document", id: string) => {
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
        const doc = documents.find(d => d.id === id);
        if (doc && doc.title === trimmed) {
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
    setEditingDocumentId(null);
    setEditValue("");
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, docId: string) => {
    setDraggedItemId(docId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", docId);
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
      alert("Failed to move file. Please try again.");
    } finally {
      setDraggedItemId(null);
      setDragOverFolderId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] max-h-[85vh]">
      {/* Left Column: Folders, Documents, Upload */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
        {/* Upload Zone */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm shrink-0">
          <h3 className="font-semibold mb-3 text-foreground">Upload Document</h3>
          <DocumentUpload 
            courseId={courseId} 
            folderId={currentFolderId}
            onUploadComplete={handleUploadComplete} 
          />
        </div>

        {/* Folder Navigation & Document List */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Header with Breadcrumbs */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              {currentFolderId ? (
                <Button variant="ghost" size="sm" onClick={handleGoBack} className="h-8 px-2">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <h3 className="font-semibold text-foreground">Documents</h3>
              )}
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                      <ArrowUpDown className="w-4 h-4 mr-1" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSort("name_asc")} className={cn(sort === "name_asc" && "bg-primary/10 text-primary font-medium")}>
                      <SortAsc className="w-4 h-4 mr-2" />
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("name_desc")} className={cn(sort === "name_desc" && "bg-primary/10 text-primary font-medium")}>
                      <SortDesc className="w-4 h-4 mr-2" />
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSort("newest")} className={cn(sort === "newest" && "bg-primary/10 text-primary font-medium")}>
                      <Clock className="w-4 h-4 mr-2" />
                      Newest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("oldest")} className={cn(sort === "oldest" && "bg-primary/10 text-primary font-medium")}>
                      <Clock className="w-4 h-4 mr-2" />
                      Oldest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" onClick={() => setNewFolderDialogOpen(true)} className="h-8 px-2">
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Breadcrumb path */}
            {folderPath.length > 0 && (
              <div className="flex items-center text-xs text-muted-foreground overflow-x-auto">
                <button 
                  onClick={() => setCurrentFolderId(null)} 
                  className="hover:text-primary whitespace-nowrap"
                >
                  Home
                </button>
                {folderPath.map((folder, index) => (
                  <span key={folder.id} className="flex items-center">
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={cn(
                        "hover:text-primary whitespace-nowrap",
                        index === folderPath.length - 1 && "font-medium text-foreground"
                      )}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Folders and Documents List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            {folders.length === 0 && documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm text-center">
                  {currentFolderId ? "This folder is empty" : "No documents uploaded yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
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
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 group transition-all",
                          dragOverFolderId === folder.id && "bg-primary/10 border-2 border-dashed border-primary/50 scale-[1.02]"
                        )}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <Folder className="w-5 h-5 text-primary" />
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
                              <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                              <p className="text-xs text-muted-foreground">Folder</p>
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
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteFolderClick(e, folder)}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
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
                          setDocumentToDelete(null);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}

                {/* Documents */}
                {documents.map((doc) => (
                  <ContextMenu key={doc.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, doc.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedDocument(doc)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startDocumentEdit(doc);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group",
                          selectedDocument?.id === doc.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50 border border-transparent",
                          draggedItemId === doc.id && "opacity-50 scale-95"
                        )}
                      >
                        {getFileIcon(doc.title)}
                        <div className="flex-1 min-w-0">
                          {editingDocumentId === doc.id ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleInlineSave("document", doc.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleInlineSave("document", doc.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="h-7 text-sm"
                            />
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground truncate">
                                {doc.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getFileType(doc.title)} • {new Date(doc.createdAt).toLocaleDateString("en-US")}
                              </p>
                              <MaterialRating
                                materialId={doc.id}
                                initialRating={doc.userRating ?? null}
                                avgRating={doc.avgRating ?? 0}
                                totalRatings={doc.totalRatings ?? 0}
                              />
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameDocument(doc);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteDocumentClick(e, doc)}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleRenameDocument(doc)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => {
                          setDocumentToDelete(doc);
                          setFolderToDelete(null);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
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
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-8 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <DocumentPreview document={selectedDocument} />
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize your documents into categories.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name (e.g., Midterm Notes)"
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
            <DialogTitle>Rename {renameTarget?.type === "folder" ? "Folder" : "Document"}</DialogTitle>
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
              Delete {documentToDelete ? "Document" : "Folder"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete
                ? `Are you sure you want to delete "${documentToDelete.title}"? This action cannot be undone.`
                : `Are you sure you want to delete folder "${folderToDelete?.name}"? This will also delete all documents and subfolders inside.`}
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
