"use client";

import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PDFViewer from "./PDFViewer";

interface Document {
  id: string;
  title: string;
  url: string;
}

interface DocumentPreviewProps {
  document: Document | null;
}

interface NotebookCell {
  cell_type: "code" | "markdown" | "raw";
  source: string[];
  outputs?: any[];
}

interface NotebookData {
  cells: NotebookCell[];
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const getProxyUrl = (originalUrl: string) => {
    try {
      if (!originalUrl) return "";
      if (originalUrl.startsWith("/")) return originalUrl;
      
      const url = new URL(originalUrl);
      // If it's an R2 (public or private) or MinIO URL, route through our proxy to handle CORS
      if (
        url.hostname.includes("r2.cloudflarestorage.com") || 
        url.hostname.includes("r2.dev") ||
        url.port === "9000"
      ) {
        // Extract the file key from the pathname (remove leading slash)
        const key = url.pathname.replace(/^\//, "").replace(/^unishare-bucket\//, "");
        return `/api/proxy/${key}`;
      }
      return originalUrl;
    } catch (e) {
      return originalUrl;
    }
  };

  const safeUrl = document ? getProxyUrl(document.url) : "";
  const directUrl = document ? document.url : "";

  const [notebookData, setNotebookData] = useState<NotebookData | null>(null);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [textData, setTextData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document && document.title.toLowerCase().endsWith('.ipynb')) {
      loadNotebook(safeUrl);
    } else if (document && document.title.toLowerCase().endsWith('.csv')) {
      loadCSV(safeUrl);
    } else if (document && (document.title.toLowerCase().endsWith('.txt') || document.title.toLowerCase().endsWith('.py'))) {
      loadText(safeUrl);
    } else {
      setNotebookData(null);
      setCsvData(null);
      setTextData(null);
    }
  }, [document, safeUrl]);

  const loadNotebook = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch notebook");
      const data = await response.json();
      setNotebookData(data);
    } catch (error) {
      console.error("Failed to load notebook:", error);
      setNotebookData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCSV = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch CSV");
      const text = await response.text();
      // Simple CSV parsing (handles basic commas, not complex quoted values)
      const rows = text.split('\n').filter(row => row.trim()).map(row => row.split(','));
      setCsvData(rows.slice(0, 50)); // Only show first 50 rows for preview
    } catch (error) {
      console.error("Failed to load CSV:", error);
      setCsvData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadText = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch text");
      const text = await response.text();
      setTextData(text);
    } catch (error) {
      console.error("Failed to load text:", error);
      setTextData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-center">Select a document to preview</p>
      </div>
    );
  }

  const fileName = document.title.toLowerCase();
  const isPDF = fileName.endsWith('.pdf');
  const isNotebook = fileName.endsWith('.ipynb');
  const isPPT = fileName.endsWith('.ppt') || fileName.endsWith('.pptx');
  const isCSV = fileName.endsWith('.csv');
  const isTXT = fileName.endsWith('.txt');
  const isPY = fileName.endsWith('.py');
  const isDOC = fileName.endsWith('.doc') || fileName.endsWith('.docx');

  // PDF Preview
  if (isPDF) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 text-foreground">{document.title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={safeUrl} download>
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <PDFViewer url={safeUrl} />
        </div>
      </div>
    );
  }

  // Notebook Preview
  if (isNotebook) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 flex items-center gap-2 text-foreground">
            <span className="text-orange-500">📓</span>
            {document.title}
          </h3>
          <Button variant="outline" size="sm" asChild>
            <a href={safeUrl} download>
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-card">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notebook...</div>
          ) : notebookData ? (
            <div className="space-y-4">
              {notebookData.cells.map((cell, index) => (
                <NotebookCellPreview key={index} cell={cell} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Failed to load notebook</div>
          )}
        </div>
      </div>
    );
  }

  // PPT Preview (using Office Online Viewer)
  if (isPPT) {
    // Office Online Viewer requires a publicly accessible URL
    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(directUrl)}`;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 text-foreground">{document.title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={directUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={directUrl} download>
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
        <div className="flex-1">
          {directUrl.includes('r2.dev') || directUrl.includes('cloudflarestorage.com') ? (
            <iframe 
              src={officeUrl} 
              className="w-full h-full border-0" 
              title="PPT Preview"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 h-full">
              <div className="w-32 h-40 bg-card rounded-lg shadow-lg flex items-center justify-center mb-6 border border-border">
                <FileText className="w-16 h-16 text-orange-500" />
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">PowerPoint Presentation</h4>
              <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
                Download the file to view it in Microsoft PowerPoint or Google Slides
              </p>
              <Button asChild>
                <a href={directUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Presentation
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DOC/DOCX Preview (using Office Online Viewer)
  if (isDOC) {
    // Office Online Viewer requires a publicly accessible URL
    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(directUrl)}`;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 text-foreground">{document.title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={directUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={directUrl} download>
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
        <div className="flex-1">
          {directUrl.includes('r2.dev') || directUrl.includes('cloudflarestorage.com') ? (
            <iframe 
              src={officeUrl} 
              className="w-full h-full border-0" 
              title="Word Document Preview"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 h-full">
              <div className="w-32 h-40 bg-card rounded-lg shadow-lg flex items-center justify-center mb-6 border border-border">
                <FileText className="w-16 h-16 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">Word Document</h4>
              <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
                Download the file to view it in Microsoft Word or Google Docs
              </p>
              <Button asChild>
                <a href={directUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Document
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CSV Preview
  if (isCSV) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 flex items-center gap-2 text-foreground">
            <Table className="w-4 h-4 text-green-600" />
            {document.title}
          </h3>
          <Button variant="outline" size="sm" asChild>
            <a href={safeUrl} download>
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-card">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading CSV...</div>
          ) : csvData ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <tbody className="bg-card divide-y divide-border">
                  {csvData.map((row, i) => (
                    <tr key={i} className={i === 0 ? "bg-muted" : ""}>
                      {row.map((cell, j) => (
                        <td key={j} className={cn(
                          "px-3 py-2 text-xs text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0",
                          i === 0 && "font-semibold text-foreground"
                        )}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length === 50 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted border-t border-border">
                  Showing first 50 rows only
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Failed to load CSV</div>
          )}
        </div>
      </div>
    );
  }

  // Python Preview
  if (isPY) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 flex items-center gap-2 text-foreground">
            <span className="text-blue-500 font-bold">Py</span>
            {document.title}
          </h3>
          <Button variant="outline" size="sm" asChild>
            <a href={safeUrl} download>
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading code...</div>
          ) : textData !== null ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-[#d4d4d4]">
              {textData}
            </pre>
          ) : (
            <div className="text-center py-8 text-gray-400">Failed to load code content</div>
          )}
        </div>
      </div>
    );
  }

  // TXT Preview
  if (isTXT) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
          <h3 className="font-medium text-sm truncate flex-1 flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-blue-500" />
            {document.title}
          </h3>
          <Button variant="outline" size="sm" asChild>
            <a href={safeUrl} download>
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-card">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading text...</div>
          ) : textData !== null ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-muted p-4 rounded border border-border">
              {textData}
            </pre>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Failed to load text content</div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for other file types
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <FileText className="w-16 h-16 text-muted-foreground mb-4" />
      <h4 className="text-lg font-medium text-foreground mb-2">{document.title}</h4>
      <Button variant="outline" asChild>
        <a href={safeUrl} download>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </a>
      </Button>
    </div>
  );
}

// Notebook Cell Component
function NotebookCellPreview({ cell, index }: { cell: NotebookCell; index: number }) {
  const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

  if (cell.cell_type === 'markdown') {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-card rounded border border-border">
        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(source) }} />
      </div>
    );
  }

  if (cell.cell_type === 'code') {
    return (
      <div className="rounded border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border text-xs text-muted-foreground">
          <span className="font-mono">[{index + 1}]</span>
        </div>
        <pre className="p-3 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
          <code>{source}</code>
        </pre>
        {cell.outputs && cell.outputs.length > 0 && (
          <div className="p-3 bg-card border-t border-border text-sm">
            {cell.outputs.map((output, i) => (
              <NotebookOutput key={i} output={output} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <pre className="p-3 bg-muted rounded border border-border text-sm overflow-x-auto text-foreground">
      {source}
    </pre>
  );
}

function NotebookOutput({ output }: { output: any }) {
  if (output.output_type === 'stream') {
    return <pre className="text-sm text-foreground">{output.text?.join?.('') || output.text}</pre>;
  }
  if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
    const data = output.data;
    if (data?.['text/plain']) {
      return <pre className="text-sm text-foreground">{data['text/plain'].join?.('') || data['text/plain']}</pre>;
    }
    if (data?.['image/png']) {
      return <img src={`data:image/png;base64,${data['image/png']}`} alt="Output" className="max-w-full" />;
    }
  }
  if (output.output_type === 'error') {
    return (
      <pre className="text-sm text-destructive">
        {output.ename}: {output.evalue}
      </pre>
    );
  }
  return null;
}

function parseMarkdown(text: string): string {
  // Simple markdown parsing - just handle basic formatting
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br/>');
}
