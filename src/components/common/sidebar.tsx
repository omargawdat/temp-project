"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Building2,
  ListChecks,
  Receipt,
  Users2,
  StickyNote,
  Globe,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, color: "#818cf8" },
  { href: "/clients", label: "Clients", icon: Building2, color: "#f97316" },
  { href: "/projects", label: "Projects", icon: FolderKanban, color: "#60a5fa" },
  { href: "/milestones", label: "Milestones", icon: ListChecks, color: "#fbbf24" },
  { href: "/invoices", label: "Invoices", icon: Receipt, color: "#f472b6" },
  { href: "/project-managers", label: "Team", icon: Users2, color: "#a78bfa" },
  { href: "/notes", label: "Notes", icon: StickyNote, color: "#f59e0b" },
  { href: "/countries", label: "Countries", icon: Globe, color: "#06b6d4" },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText, color: "#94a3b8" },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex h-full flex-shrink-0 flex-col transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        open ? "w-60" : "w-20",
      )}
      style={{
        background: "var(--sidebar)",
      }}
    >
      {/* Right border */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-sidebar-border" />

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-secondary-foreground"
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-5 pt-5 pb-6", !open && "justify-center px-0")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/blackstone-logo.svg" alt="BlackStone" className="h-10 w-10 flex-shrink-0" />
        {open && (
          <div className="overflow-hidden">
            <p className="text-[14px] font-bold text-sidebar-primary-foreground tracking-tight">BlackStone</p>
            <p className="text-[10px] font-medium tracking-widest text-sidebar-foreground/40 uppercase">Delivery</p>
          </div>
        )}
      </div>

      {/* Nav label */}
      {open && (
        <p className="px-5 mb-2 text-[10px] font-semibold tracking-widest text-sidebar-foreground/30 uppercase">
          Menu
        </p>
      )}

      {/* Nav items */}
      <nav aria-label="Main navigation" className={cn("flex-1 px-3", !open && "px-2")}>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-xl transition-all duration-200",
                  open ? "gap-3.5 px-3.5 py-3" : "justify-center p-3",
                  isActive
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50",
                )}
              >
                {/* Icon container */}
                <div
                  className={cn(
                    "flex flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                    open ? "h-10 w-10" : "h-11 w-11",
                    isActive
                      ? "shadow-lg"
                      : "bg-sidebar-accent/50 group-hover:bg-sidebar-accent",
                  )}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                          boxShadow: `0 4px 12px ${item.color}15`,
                        }
                      : undefined
                  }
                >
                  <item.icon
                    className={cn(
                      "transition-colors duration-200",
                      open ? "h-5 w-5" : "h-[22px] w-[22px]",
                      !isActive && "text-slate-400 group-hover:text-slate-300",
                    )}
                    style={{ color: isActive ? item.color : undefined }}
                    color={isActive ? item.color : undefined}
                    strokeWidth={1.6}
                  />
                </div>

                {/* Label */}
                {open && (
                  <div className="overflow-hidden">
                    <span
                      className={cn(
                        "text-[13px] font-semibold transition-colors",
                        isActive ? "text-sidebar-accent-foreground" : "text-slate-400 group-hover:text-slate-300",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                )}

                {/* Active dot when collapsed */}
                {!open && isActive && (
                  <div
                    className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
                    style={{ background: item.color }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("px-3 pb-4", !open && "px-2")}>
        {/* Settings */}
        {(() => {
          const isActive = pathname === "/settings" || pathname.startsWith("/settings/");
          return (
            <Link
              href="/settings"
              className={cn(
                "group flex items-center rounded-xl transition-all duration-200",
                open ? "gap-3.5 px-3.5 py-2.5" : "justify-center p-3",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70",
              )}
            >
              <Settings
                className={cn(open ? "h-5 w-5" : "h-[22px] w-[22px]")}
                strokeWidth={1.6}
              />
              {open && <span className="text-[13px] font-medium">Settings</span>}
            </Link>
          );
        })()}

        {/* Separator */}
        <div className={cn("my-3 h-px bg-sidebar-border", !open && "mx-2")} />

        {/* User row */}
        <div
          className={cn(
            "flex items-center rounded-xl",
            open ? "gap-3 px-3 py-2" : "justify-center py-2",
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-[11px] font-bold text-sidebar-primary-foreground">
              OG
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-400" />
          </div>
          {open && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-sidebar-foreground">Omar Gawdat</p>
                <p className="truncate text-[10px] text-sidebar-foreground/30">Project Director</p>
              </div>
              <button className="text-sidebar-foreground/20 hover:text-sidebar-foreground/60 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
