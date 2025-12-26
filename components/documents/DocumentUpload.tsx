"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveMaterialToDb } from "@/app/actions/materials";
import { MaterialType } from "@prisma/client";

interface DocumentUploadProps {
  courseId: string;
  folderId?: string | null;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ courseId, folderId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    
    const file = e.dataTransfer.files[0];
    if (file && isValidDocumentType(file)) {
      setSelectedFile(file);
    } else {
      alert("Please upload a PDF, IPYNB, or PPT/PPTX file.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidDocumentType(file)) {
      setSelectedFile(file);
    } else if (file) {
      alert("Please upload a PDF, IPYNB, or PPT/PPTX file.");
    }
  };

  const isValidDocumentType = (file: File): boolean => {
    const validExtensions = ['.pdf', '.ipynb', '.ppt', '.pptx'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. Get Presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
        }),
      });

      if (!presignedRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await presignedRes.json();

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) throw new Error("Cloud upload failed");

      // 3. Save to Database
      const dbRes = await saveMaterialToDb({
        title: selectedFile.name,
        url: publicUrl,
        type: MaterialType.FILE,
        courseId,
        folderId,
      });

      if (!dbRes.success) throw new Error(dbRes.error);

      setSelectedFile(null);
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
  };

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
          accept=".pdf,.ipynb,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-gray-400">
            PDF, IPYNB, PPT, PPTX
          </p>
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {selectedFile && (
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      )}
    </div>
  );
}

