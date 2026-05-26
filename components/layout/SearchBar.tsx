"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { getCourses } from "@/app/actions/courses";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof getCourses>>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const data = await getCourses(query, 5);
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/courses/${results[activeIndex].id}`);
        setOpen(false);
        setQuery("");
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-xl relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          className="pl-10 pr-20 bg-muted/50 border-input focus:bg-background transition-colors"
          placeholder="Search courses..."
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {results.map((course, i) => (
            <button
              key={course.id}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                i === activeIndex ? "bg-accent" : "hover:bg-muted/50"
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                router.push(`/courses/${course.id}`);
                setOpen(false);
                setQuery("");
              }}
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{course.code.slice(0, 4)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{course.title}</p>
                <p className="text-xs text-muted-foreground">
                  {course.code}
                  {course.department?.name && ` · ${course.department.name}`}
                </p>
              </div>
            </button>
          ))}
          <div className="border-t border-border px-4 py-2">
            <button
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setOpen(false);
                setQuery("");
              }}
            >
              Search all courses for &quot;{query}&quot; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
