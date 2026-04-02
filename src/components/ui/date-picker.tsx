"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ProjectDatePickerProps {
  name: string;
  label: string;
  defaultValue?: string;
  compact?: boolean;
  onValueChange?: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const CALENDAR_HEIGHT = 330;
const CALENDAR_WIDTH = 280;
const GAP = 6;

export function ProjectDatePicker({ name, label, defaultValue, compact, onValueChange }: ProjectDatePickerProps) {
  const initial = defaultValue ? new Date(defaultValue) : null;
  const [selected, setSelected] = useState<Date | null>(initial);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initial?.getMonth() ?? new Date().getMonth());
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow >= CALENDAR_HEIGHT + GAP) {
      top = rect.bottom + GAP;
    } else if (spaceAbove >= CALENDAR_HEIGHT + GAP) {
      top = rect.top - CALENDAR_HEIGHT - GAP;
    } else {
      top = Math.max(GAP, window.innerHeight - CALENDAR_HEIGHT - GAP);
    }

    let left = rect.left;
    if (left + CALENDAR_WIDTH > window.innerWidth - GAP) {
      left = window.innerWidth - CALENDAR_WIDTH - GAP;
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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevYear() { setViewYear(viewYear - 1); }
  function nextYear() { setViewYear(viewYear + 1); }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDate(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    setSelected(d);
    setOpen(false);
    onValueChange?.();
  }

  const formValue = selected ? selected.toISOString().split("T")[0] : "";
  const displayValue = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : "";

  const isSelected = (day: number) =>
    selected?.getDate() === day &&
    selected?.getMonth() === viewMonth &&
    selected?.getFullYear() === viewYear;

  const isToday = (day: number) => {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === viewMonth && t.getFullYear() === viewYear;
  };

  const calendar = open && pos ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] w-[280px] rounded-lg border border-border bg-card p-3 shadow-xl shadow-black/30"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <button type="button" onClick={prevYear} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={prevMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs font-semibold text-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <div className="flex items-center">
            <button type="button" onClick={nextMonth} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={nextYear} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
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
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDate(day)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors ${
                  isSelected(day)
                    ? "bg-primary font-bold text-white"
                    : isToday(day)
                      ? "font-bold text-primary"
                      : "text-foreground hover:bg-accent hover:text-primary"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
          <button
            type="button"
            onClick={() => { setSelected(new Date()); setOpen(false); onValueChange?.(); }}
            className="text-xs font-medium text-primary transition-colors hover:text-primary"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => { setSelected(null); setOpen(false); onValueChange?.(); }}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div>
      {compact ? (
        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </label>
      ) : (
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={compact
          ? "flex w-full items-center justify-between rounded-md border border-border bg-accent px-2.5 text-xs text-foreground transition-all hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-ring h-8 mt-1"
          : "flex h-10 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 text-sm text-foreground transition-all hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring"
        }
      >
        <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
          {displayValue || "Pick a date"}
        </span>
        <Calendar className={compact ? "h-3 w-3 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
      </button>

      {/* Hidden input for form */}
      <input type="hidden" name={name} value={formValue} />

      {calendar}
    </div>
  );
}
