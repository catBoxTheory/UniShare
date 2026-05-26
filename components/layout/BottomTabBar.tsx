"use client";

import { Layout, Library, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => onTabChange("home")}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
            activeTab === "home" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <Layout className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => onTabChange("library")}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
            activeTab === "library" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <Library className="h-5 w-5" />
          <span className="text-[10px] font-medium">Library</span>
        </button>
        <button
          onClick={() => onTabChange("saved")}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
            activeTab === "saved" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
      </div>
    </nav>
  );
}
