"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarRange, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimelineProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  milestones: { id: string; name: string; plannedDate: Date; status: string }[];
  completionPct: number;
}

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface TabTimelineProps {
  projects: TimelineProject[];
  activityData: ActivityDay[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

function dateToPercent(date: Date, min: number, max: number): number {
  if (max === min) return 50;
  return ((new Date(date).getTime() - min) / (max - min)) * 100;
}

function getBarColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500";
    case "ON_HOLD":
      return "bg-amber-400";
    case "CLOSED":
      return "bg-slate-300";
    default:
      return "bg-slate-300";
  }
}

function getMilestoneColor(status: string): string {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "COMPLETED":
      return "bg-emerald-500";
    case "INVOICED":
      return "bg-indigo-500";
    case "READY_FOR_INVOICING":
      return "bg-purple-500";
    case "NOT_STARTED":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

function getHeatColor(count: number): string {
  if (count >= 5) return "bg-primary";
  if (count >= 3) return "bg-primary/60";
  if (count >= 2) return "bg-primary/40";
  if (count >= 1) return "bg-primary/20";
  return "bg-accent";
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

/* ------------------------------------------------------------------ */
/*  Gantt Timeline                                                     */
/* ------------------------------------------------------------------ */

function ProjectTimeline({ projects }: { projects: TimelineProject[] }) {
  const { minTs, maxTs, months } = useMemo(() => {
    if (projects.length === 0) return { minTs: 0, maxTs: 0, months: [] };

    let earliest = Infinity;
    let latest = -Infinity;
    for (const p of projects) {
      const s = new Date(p.startDate).getTime();
      const e = new Date(p.endDate).getTime();
      if (s < earliest) earliest = s;
      if (e > latest) latest = e;
    }

    // Add 5% padding on each side
    const range = latest - earliest || DAY_MS * 30;
    const pad = range * 0.05;
    const min = earliest - pad;
    const max = latest + pad;

    // Build month markers within the padded range
    const monthMarkers: { label: string; pct: number }[] = [];
    const start = new Date(min);
    // Start from the first day of the month after or at `start`
    const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    while (cursor.getTime() < max) {
      const pct = ((cursor.getTime() - min) / (max - min)) * 100;
      monthMarkers.push({ label: `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`, pct });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Thin out labels to avoid overlap: show at most ~8 labels
    const step = Math.max(1, Math.ceil(monthMarkers.length / 8));
    const visibleMarkers = monthMarkers.filter((_, i) => i % step === 0);

    return { minTs: min, maxTs: max, months: visibleMarkers };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
        No projects to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Month axis */}
      <div className="flex">
        <div className="w-40 shrink-0" />
        <div className="relative h-6 flex-1">
          {months.map((m) => (
            <span
              key={m.label}
              className="absolute top-0 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Project rows */}
      {projects.map((project) => {
        const barLeft = dateToPercent(project.startDate, minTs, maxTs);
        const barRight = dateToPercent(project.endDate, minTs, maxTs);
        const barWidth = Math.max(barRight - barLeft, 0.5);

        return (
          <div key={project.id} className="group flex items-center border-t border-border/30" style={{ height: 40 }}>
            {/* Project name */}
            <div className="w-40 shrink-0 pr-3">
              <Link
                href={`/projects/${project.id}`}
                className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                title={project.name}
              >
                {project.name}
              </Link>
            </div>

            {/* Timeline bar area */}
            <div className="relative flex-1" style={{ height: 40 }}>
              {/* Bar */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-5 rounded-md transition-opacity",
                  getBarColor(project.status),
                  "opacity-80 group-hover:opacity-100",
                )}
                style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
              >
                {/* Completion fill overlay */}
                {project.completionPct > 0 && project.completionPct < 100 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-md bg-white/20"
                    style={{ width: `${project.completionPct}%` }}
                  />
                )}
              </div>

              {/* Milestone dots */}
              {project.milestones.map((ms) => {
                const msPct = dateToPercent(ms.plannedDate, minTs, maxTs);
                return (
                  <div
                    key={ms.id}
                    className={cn(
                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                      getMilestoneColor(ms.status),
                    )}
                    style={{ left: `${msPct}%` }}
                    title={`${ms.name} (${ms.status.replace(/_/g, " ").toLowerCase()})`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Heat Calendar                                             */
/* ------------------------------------------------------------------ */

interface WeekColumn {
  weekIndex: number;
  days: { date: string; dayOfWeek: number; count: number }[];
  firstMonth: number | null; // month number if a new month starts in this week
}

function ActivityHeatCalendar({ activityData }: { activityData: ActivityDay[] }) {
  const { weeks, monthLabels } = useMemo(() => {
    const lookup = new Map<string, number>();
    for (const d of activityData) {
      lookup.set(d.date, d.count);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Saturday (end of the last complete week)
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay())); // move to Saturday

    // Go back 52 weeks from that Saturday to get start Sunday
    const startDay = new Date(endDay);
    startDay.setDate(startDay.getDate() - 52 * 7 + 1);

    const cols: WeekColumn[] = [];
    const mLabels: { label: string; weekIdx: number }[] = [];
    let prevMonth = -1;
    const cursor = new Date(startDay);

    for (let w = 0; w < 52; w++) {
      const days: WeekColumn["days"] = [];
      let firstMonth: number | null = null;

      for (let d = 0; d < 7; d++) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const month = cursor.getMonth();

        if (month !== prevMonth) {
          firstMonth = month;
          prevMonth = month;
        }

        days.push({
          date: dateStr,
          dayOfWeek: d,
          count: lookup.get(dateStr) ?? 0,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      if (firstMonth !== null) {
        mLabels.push({ label: MONTH_LABELS[firstMonth], weekIdx: w });
      }

      cols.push({ weekIndex: w, days, firstMonth });
    }

    return { weeks: cols, monthLabels: mLabels };
  }, [activityData]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        {/* Month labels row */}
        <div className="flex" style={{ paddingLeft: 28 }}>
          {(() => {
            const cells: React.ReactNode[] = [];
            let lastRenderedWeek = -3;
            for (const ml of monthLabels) {
              // Only render if there is enough gap to avoid overlap
              if (ml.weekIdx - lastRenderedWeek >= 3) {
                cells.push(
                  <span
                    key={ml.weekIdx}
                    className="text-[10px] text-muted-foreground"
                    style={{
                      position: "absolute",
                      left: ml.weekIdx * 12,
                    }}
                  >
                    {ml.label}
                  </span>,
                );
                lastRenderedWeek = ml.weekIdx;
              }
            }
            return <div className="relative h-4" style={{ width: 52 * 12 }}>{cells}</div>;
          })()}
        </div>

        {/* Grid with day labels */}
        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col" style={{ width: 28 }}>
            {Array.from({ length: 7 }).map((_, row) => (
              <div key={row} className="flex items-center" style={{ height: 12 }}>
                {DAY_LABELS[row] ? (
                  <span className="text-[10px] text-muted-foreground leading-none">{DAY_LABELS[row]}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-px">
            {weeks.map((week) => (
              <div key={week.weekIndex} className="flex flex-col gap-px">
                {week.days.map((day) => (
                  <div
                    key={day.date}
                    className={cn("rounded-sm", getHeatColor(day.count))}
                    style={{ width: 10, height: 10 }}
                    title={`${day.date}: ${day.count} activit${day.count === 1 ? "y" : "ies"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-1 pr-1">
          <span className="text-[10px] text-muted-foreground mr-0.5">Less</span>
          {[0, 1, 2, 3, 5].map((level) => (
            <div
              key={level}
              className={cn("rounded-sm", getHeatColor(level))}
              style={{ width: 10, height: 10 }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">More</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function TabTimeline({ projects, activityData }: TabTimelineProps) {
  return (
    <div className="space-y-4">
      {/* Gantt-style Project Timeline */}
      <div className="rounded-xl bg-card card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarRange className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Project Timeline</span>
        </div>
        <ProjectTimeline projects={projects} />
      </div>

      {/* Activity Heat Calendar */}
      <div className="rounded-xl bg-card card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-foreground">Activity</span>
        </div>
        <ActivityHeatCalendar activityData={activityData} />
      </div>
    </div>
  );
}
