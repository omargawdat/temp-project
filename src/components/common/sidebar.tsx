"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  FileText,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/milestones", label: "Milestones", icon: ListChecks },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/project-managers", label: "Team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-gradient border-sidebar-border flex h-full w-[260px] flex-shrink-0 flex-col border-r">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/blackstone-logo.svg" alt="Blackstone" className="h-9 w-9" />
        <div>
          <span className="text-sidebar-accent-foreground text-[15px] font-bold tracking-tight">
            BlackStone eIT
          </span>
          <span className="block text-[10px] font-medium tracking-[0.15em] text-indigo-400/70 uppercase">
            Delivery Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-6">
        <p className="text-sidebar-foreground/30 mb-3 px-3 text-[10px] font-bold tracking-[0.2em] uppercase">
          Navigation
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {isActive && (
                  <div className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-sidebar-foreground/5 text-sidebar-foreground/40 group-hover:bg-sidebar-foreground/10 group-hover:text-sidebar-foreground/60",
                  )}
                >
                  <item.icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-indigo-400/50" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-sidebar-border border-t px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 opacity-50 blur-[2px]" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white">
              PM
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-accent-foreground truncate text-[13px] font-semibold">
              Project Manager
            </p>
            <p className="text-sidebar-foreground/40 truncate text-[11px]">
              pm@company.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
