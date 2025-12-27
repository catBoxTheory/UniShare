"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveMaterialToDb } from "@/app/actions/materials";
import { MaterialType } from "@prisma/client";

interface DocumentUploadProps {
  courseId: string;
  folderId?: string | null;
  onUploadComplete?: () => void;
}

interface SelectedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function DocumentUpload({ courseId, folderId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(isValidDocumentType);
    
    if (validFiles.length === 0) {
      alert("Unsupported file format.");
      return;
    }
    
    if (validFiles.length < files.length) {
      alert(`${files.length - validFiles.length} file(s) skipped (unsupported format).`);
    }
    
    setSelectedFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({ file, status: "pending" as const }))
    ]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = files.filter(isValidDocumentType);
    
    if (validFiles.length === 0 && files.length > 0) {
      alert("Unsupported file format.");
      return;
    }
    
    if (validFiles.length < files.length) {
      alert(`${files.length - validFiles.length} file(s) skipped (unsupported format).`);
    }
    
    setSelectedFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({ file, status: "pending" as const }))
    ]);
    
    // Reset input
    e.target.value = "";
  };

  const isValidDocumentType = (file: File): boolean => {
    const validExtensions = ['.pdf', '.ipynb', '.ppt', '.pptx', '.csv', '.txt', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const selectedFile = selectedFiles[i];
      // Allow uploading pending or error files
      if (selectedFile.status !== "pending" && selectedFile.status !== "error") continue;
      
      // Update status to uploading
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: "uploading" as const, error: undefined } : f
      ));
      
      try {
        // 1. Get Presigned URL
        const presignedRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.file.name,
            contentType: selectedFile.file.type || "application/octet-stream",
          }),
        });

        if (!presignedRes.ok) {
          const errorData = await presignedRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get upload URL");
        }
        
        const { uploadUrl, publicUrl } = await presignedRes.json();

        // 2. Upload directly to R2
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile.file,
          headers: {
            "Content-Type": selectedFile.file.type || "application/octet-stream",
          },
        });

        if (!uploadRes.ok) {
          // Check for CORS or other browser errors
          if (uploadRes.status === 0) {
            throw new Error("Network error or CORS policy blocked the upload. Please check bucket CORS settings.");
          }
          throw new Error(`Cloud upload failed: ${uploadRes.statusText}`);
        }

        // 3. Save to Database
        const dbRes = await saveMaterialToDb({
          title: selectedFile.file.name,
          url: publicUrl,
          type: MaterialType.FILE,
          courseId,
          folderId,
        });

        if (!dbRes.success) throw new Error(dbRes.error);

        // Update status to done
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: "done" as const } : f
        ));
      } catch (error: any) {
        console.error("Upload error:", error);
        // Update status to error
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: "error" as const, error: error.message } : f
        ));
      }
    }
    
    setIsUploading(false);
    onUploadComplete?.();
    
    // Clear completed files after a short delay
    setTimeout(() => {
      setSelectedFiles(prev => prev.filter(f => f.status !== "done"));
    }, 2000);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
  };

  const uploadableFiles = selectedFiles.filter(f => f.status === "pending" || f.status === "error");
  const uploadableCount = uploadableFiles.length;

  // Debug logging to help identify why files might not be seen as uploadable
  if (selectedFiles.length > 0 && uploadableCount === 0) {
    console.log("[DocumentUpload] Files selected but none are uploadable:", selectedFiles.map(f => ({ name: f.file.name, status: f.status })));
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
        )}
      >
        <input
          type="file"
          id="document-upload"
          accept=".pdf,.ipynb,.ppt,.pptx,.csv,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-gray-400">
            Multiple files supported
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {selectedFiles.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col gap-1"
            >
              <div 
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border",
                  item.status === "done" && "bg-green-50 border-green-200",
                  item.status === "error" && "bg-red-50 border-red-200",
                  item.status === "uploading" && "bg-blue-50 border-blue-200",
                  item.status === "pending" && "bg-gray-50 border-gray-200"
                )}
              >
                <FileText className={cn(
                  "w-6 h-6 flex-shrink-0",
                  item.status === "done" && "text-green-500",
                  item.status === "error" && "text-red-500",
                  item.status === "uploading" && "text-blue-500",
                  item.status === "pending" && "text-gray-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {item.status === "uploading" && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {item.status === "done" && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {(item.status === "pending" || item.status === "error") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {item.error && (
                <p className="text-[10px] text-red-500 px-2 line-clamp-2">
                  Error: {item.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || uploadableCount === 0}
            className="flex-1"
          >
            {isUploading ? "Uploading..." : `Upload ${uploadableCount} File${uploadableCount !== 1 ? 's' : ''}`}
          </Button>
          {!isUploading && (
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
