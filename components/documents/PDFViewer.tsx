"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <p className="mb-4">Unable to preview PDF in browser.</p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
          <Button asChild>
            <a href={url} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="PDF Preview"
        onError={() => setLoadError(true)}
      />
    </div>
  );
}

