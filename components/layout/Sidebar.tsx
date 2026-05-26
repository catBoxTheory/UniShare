"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Library, Bookmark, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  onTabChange?: (tab: string) => void
  activeTab?: string
}

export function Sidebar({ onTabChange, activeTab = "home" }: SidebarProps) {
  const pathname = usePathname()

  const items = [
    {
      title: "Home",
      icon: Home,
      value: "home",
      onClick: () => onTabChange?.("home"),
    },
    {
      title: "My Library",
      icon: Library,
      value: "library",
      onClick: () => onTabChange?.("library"),
    },
    {
      title: "Saved",
      icon: Bookmark,
      value: "saved",
      onClick: () => onTabChange?.("saved"),
    },
  ]

  return (
    <div className="w-64 border-r border-border bg-background h-full hidden lg:flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <BookOpen className="w-6 h-6" />
          <span>UniShare</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
              activeTab === item.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </button>
        ))}
      </nav>

      {/* Mobile/Footer Links could go here */}
    </div>
  )
}

