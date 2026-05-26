"use client";

import { useState, useEffect, useRef } from "react";
import { NotebookPen, Check, Loader2 } from "lucide-react";
import { saveNote, getNote } from "@/app/actions/notes";
import { cn } from "@/lib/utils";

interface MaterialNoteEditorProps {
  materialId: string;
}

export function MaterialNoteEditor({ materialId }: MaterialNoteEditorProps) {
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      getNote(materialId).then((note) => {
        if (note) {
          setContent(note.content);
          setInitialContent(note.content);
        }
      });
    }
  }, [materialId]);

  const handleSave = async (text: string) => {
    if (!text.trim()) return;
    setSaving(true);
    setSaved(false);
    await saveNote(materialId, text);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (value: string) => {
    setContent(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(value), 1000);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (content !== initialContent) {
      handleSave(content);
      setInitialContent(content);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 text-xs transition-colors",
          content ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <NotebookPen className="h-3.5 w-3.5" />
        {content ? "Edit notes" : "Add notes"}
      </button>

      {open && (
        <div className="mt-2">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write your private notes here..."
            className="w-full h-24 text-sm bg-muted/50 border border-border rounded-lg p-3 resize-none focus:outline-none focus:border-emerald-500/50"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1">
            {saving ? (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Auto-saves as you type
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
