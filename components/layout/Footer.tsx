import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterProps {
  variant?: "solid" | "default";
}

export function Footer({ variant = "default" }: FooterProps) {
  return (
    <footer className={cn(
      "w-full border-t py-6 mt-auto",
      variant === "solid"
        ? "bg-white border-slate-200"
        : "bg-muted/30 border-border"
    )}>
      <div className={cn(
        "container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm",
        variant === "solid" ? "text-slate-500" : "text-muted-foreground"
      )}>
        <p>© 2025 UniShare. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className={cn(
            "transition-colors",
            variant === "solid" ? "hover:text-slate-900" : "hover:text-foreground"
          )}>Privacy Policy</Link>
          <Link href="/terms" className={cn(
            "transition-colors",
            variant === "solid" ? "hover:text-slate-900" : "hover:text-foreground"
          )}>Terms of Service</Link>
          <Link href="/contact" className={cn(
            "transition-colors",
            variant === "solid" ? "hover:text-slate-900" : "hover:text-foreground"
          )}>Contact</Link>
        </div>
      </div>
    </footer>
  );
}

