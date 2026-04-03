/**
 * Shared milestone filtering, counting, and date helpers.
 * Eliminates duplication across dashboard, detail pages, and pm-stats.
 */

export const COMPLETED_STATUSES = [
  "COMPLETED",
  "INVOICED",
] as const;

export function isCompleted(status: string): boolean {
  return (COMPLETED_STATUSES as readonly string[]).includes(status);
}

export function isOverdue(
  m: { status: string; plannedDate: Date | string },
  now: Date = new Date(),
): boolean {
  return !isCompleted(m.status) && new Date(m.plannedDate) < now;
}

/** Positive = past (overdue), negative = future. */
export function daysDifference(
  date: Date | string,
  reference: Date = new Date(),
): number {
  return Math.ceil(
    (reference.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function countCompleted(milestones: { status: string }[]): number {
  return milestones.filter((m) => isCompleted(m.status)).length;
}

export function completionPercent(milestones: { status: string }[]): number {
  if (milestones.length === 0) return 0;
  return Math.round((countCompleted(milestones) / milestones.length) * 100);
}

export function filterOverdue<
  T extends { status: string; plannedDate: Date | string },
>(milestones: T[], now: Date = new Date()): T[] {
  return milestones.filter((m) => isOverdue(m, now));
}

export function filterUpcoming<
  T extends { status: string; plannedDate: Date | string },
>(
  milestones: T[],
  daysAhead: number = 30,
  now: Date = new Date(),
): T[] {
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return milestones.filter(
    (m) =>
      !isCompleted(m.status) &&
      new Date(m.plannedDate) >= now &&
      new Date(m.plannedDate) <= cutoff,
  );
}
