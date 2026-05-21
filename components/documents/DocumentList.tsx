"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Presentation, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface Document {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

interface DocumentListProps {
  documents: Document[];
  selectedId?: string;
  onSelect: (doc: Document) => void;
  onDelete?: (docId: string) => void;
}

function getFileIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (lower.endsWith('.ipynb')) {
    return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
  }
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
    return <Presentation className="w-5 h-5 text-orange-600" />;
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

export function DocumentList({ documents, selectedId, onSelect, onDelete }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${documentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      if (onDelete) {
        onDelete(documentToDelete.id);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FileText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
            selectedId === doc.id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted/50 border border-transparent"
          )}
        >
          {getFileIcon(doc.title)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {doc.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {getFileType(doc.title)} • {new Date(doc.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
          {/* Delete button - visible on hover */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleDeleteClick(e, doc)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{documentToDelete?.title}&quot;? This action cannot be undone and will permanently remove the document from storage.
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
    </>
  );
}
