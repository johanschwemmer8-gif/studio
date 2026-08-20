
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface HubNavItem {
  label: string;
  href: string;
}

interface HubNavProps {
  items: HubNavItem[];
  className?: string;
}

/**
 * Outcome-First Hub Navigation
 * Standardized sub-navigation for parent feature areas.
 */
export function HubNav({ items, className }: HubNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-wrap gap-2 pb-2", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 transition-all",
              isActive 
                ? "bg-primary text-primary-foreground border-primary shadow-md" 
                : "bg-background text-muted-foreground border-primary/5 hover:border-primary/20 hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
