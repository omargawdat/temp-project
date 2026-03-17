/** Canonical style definitions for all entity statuses and client sectors. */

export interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  // Project statuses
  ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  ON_HOLD: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  CLOSED: { bg: "bg-white/5", text: "text-white/40", dot: "bg-white/30" },

  // Milestone statuses
  NOT_STARTED: { bg: "bg-white/5", text: "text-white/40", dot: "bg-white/30" },
  IN_PROGRESS: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  READY_FOR_INVOICING: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  INVOICED: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },

  // Delivery note statuses
  DRAFT: { bg: "bg-white/5", text: "text-white/40", dot: "bg-white/30" },
  SENT: { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
  SIGNED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },

  // Invoice statuses
  SUBMITTED: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  UNDER_REVIEW: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400 animate-pulse" },
  APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  PAID: { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

export const DEFAULT_STATUS_STYLE: StatusStyle = {
  bg: "bg-white/5",
  text: "text-white/40",
  dot: "bg-white/30",
};

export const SECTOR_STYLES: Record<string, StatusStyle> = {
  GOVERNMENT: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  PRIVATE: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  SEMI_GOVERNMENT: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
};

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const formatSector = formatStatus;

/** Toolbar-friendly status option lists (matches ToolbarStatusPills shape) */
export const PROJECT_STATUSES = [
  { key: "ACTIVE", label: "Active", dot: "bg-emerald-400" },
  { key: "ON_HOLD", label: "On Hold", dot: "bg-amber-400" },
  { key: "CLOSED", label: "Closed", dot: "bg-zinc-400" },
] as const;

export const MILESTONE_STATUSES = [
  { key: "NOT_STARTED", label: "Not Started", dot: "bg-zinc-400" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-400" },
  { key: "COMPLETED", label: "Completed", dot: "bg-emerald-400" },
  { key: "READY_FOR_INVOICING", label: "Ready for Invoicing", dot: "bg-purple-400" },
  { key: "INVOICED", label: "Invoiced", dot: "bg-indigo-400" },
] as const;

export const INVOICE_STATUSES = [
  { key: "DRAFT", label: "Draft", dot: "bg-zinc-400" },
  { key: "SUBMITTED", label: "Submitted", dot: "bg-amber-400" },
  { key: "UNDER_REVIEW", label: "Under Review", dot: "bg-orange-400" },
  { key: "APPROVED", label: "Approved", dot: "bg-emerald-400" },
  { key: "PAID", label: "Paid", dot: "bg-teal-400" },
  { key: "REJECTED", label: "Rejected", dot: "bg-red-400" },
] as const;

export const CLIENT_SECTORS = [
  { key: "GOVERNMENT", label: "Government", dot: "bg-blue-400" },
  { key: "PRIVATE", label: "Private", dot: "bg-emerald-400" },
  { key: "SEMI_GOVERNMENT", label: "Semi Government", dot: "bg-amber-400" },
] as const;
