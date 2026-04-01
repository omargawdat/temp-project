"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 460;
const GAP = 6;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const PRESETS = [
  { label: "This Month", getRange: () => { const n = new Date(); return { from: toISO(new Date(n.getFullYear(), n.getMonth(), 1)), to: toISO(new Date(n.getFullYear(), n.getMonth() + 1, 0)) }; } },
  { label: "Next 30 Days", getRange: () => { const n = new Date(); const e = new Date(n); e.setDate(e.getDate() + 30); return { from: toISO(n), to: toISO(e) }; } },
  { label: "This Quarter", getRange: () => { const n = new Date(); const q = Math.floor(n.getMonth() / 3) * 3; return { from: toISO(new Date(n.getFullYear(), q, 1)), to: toISO(new Date(n.getFullYear(), q + 3, 0)) }; } },
  { label: "Last 3 Months", getRange: () => { const n = new Date(); return { from: toISO(new Date(n.getFullYear(), n.getMonth() - 3, 1)), to: toISO(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
] as const;

export function ToolbarDateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string | null, to: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState<"from" | "to">("from");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  const initYear = fromDate?.getFullYear() ?? new Date().getFullYear();
  const initMonth = fromDate?.getMonth() ?? new Date().getMonth();
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  const hasValue = !!from || !!to;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow >= PANEL_HEIGHT + GAP) {
      top = rect.bottom + GAP;
    } else if (spaceAbove >= PANEL_HEIGHT + GAP) {
      top = rect.top - PANEL_HEIGHT - GAP;
    } else {
      top = Math.max(GAP, window.innerHeight - PANEL_HEIGHT - GAP);
    }

    let left = rect.left;
    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = window.innerWidth - PANEL_WIDTH - GAP;
    }

    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      const d = picking === "from" ? fromDate : toDate;
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, picking]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const iso = toISO(d);
    if (picking === "from") {
      const newTo = toDate && d > toDate ? null : to || null;
      onChange(iso, newTo);
      setPicking("to");
    } else {
      const newFrom = fromDate && d < fromDate ? null : from || null;
      onChange(newFrom, iso);
    }
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    const range = preset.getRange();
    onChange(range.from, range.to);
    setOpen(false);
  }

  function formatLabel() {
    if (from && to) return `${formatDateShort(from)} – ${formatDateShort(to)}`;
    if (from) return `From ${formatDateShort(from)}`;
    if (to) return `Until ${formatDateShort(to)}`;
    return "Date Range";
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  function getDayState(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const isFrom = fromDate && isSameDay(d, fromDate);
    const isTo = toDate && isSameDay(d, toDate);
    const inRange = fromDate && toDate && d > fromDate && d < toDate;
    const isToday = isSameDay(d, today);
    return { isFrom, isTo, inRange, isToday };
  }

  const calendar = open && pos ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] w-[380px] rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/40"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 border-b border-border/30 p-3">
          {PRESETS.map((preset) => {
            const range = preset.getRange();
            const isActive = from === range.from && to === range.to;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                  isActive
                    ? "border-primary/40 bg-accent text-primary"
                    : "border-border/40 bg-background/40 text-muted-foreground hover:border-border/70 hover:text-secondary-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* From / To tabs */}
        <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
          <button
            type="button"
            onClick={() => setPicking("from")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-all",
              picking === "from"
                ? "bg-accent text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-secondary-foreground",
            )}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</span>
            <span className="mt-0.5 block">{from ? formatDateShort(from) : "—"}</span>
          </button>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <button
            type="button"
            onClick={() => setPicking("to")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-all",
              picking === "to"
                ? "bg-accent text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-secondary-foreground",
            )}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</span>
            <span className="mt-0.5 block">{to ? formatDateShort(to) : "—"}</span>
          </button>
        </div>

        {/* Calendar */}
        <div className="p-3">
          {/* Month nav */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAYS.map((d) => (
              <span key={d} className="py-1 text-[10px] font-semibold text-muted-foreground">{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 text-center">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { isFrom, isTo, inRange, isToday } = getDayState(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center text-xs transition-colors",
                    // Range background
                    inRange && "bg-primary/[0.07]",
                    // From/To endpoints
                    (isFrom || isTo)
                      ? "rounded-md bg-primary font-bold text-white"
                      : isToday
                        ? "rounded-md font-bold text-primary"
                        : "rounded-md text-foreground hover:bg-accent hover:text-primary",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/30 px-3 py-2">
          <button
            type="button"
            onClick={() => { onChange(null, null); setOpen(false); }}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              hasValue
                ? "text-muted-foreground hover:text-foreground"
                : "pointer-events-none text-muted-foreground/60",
            )}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Apply
          </button>
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        className={cn(
          "h-10 gap-2 px-4 text-sm font-medium",
          hasValue && "border-primary/30 text-primary",
        )}
        onClick={() => { setOpen(!open); setPicking("from"); }}
      >
        <CalendarDays className="h-4 w-4" />
        {formatLabel()}
        {hasValue && (
          <span
            role="button"
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null, null);
            }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </Button>
      {calendar}
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
