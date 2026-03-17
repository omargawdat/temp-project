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

/** Toolbar-friendly status option lists */
export const PROJECT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CLOSED", label: "Closed" },
] as const;

export const MILESTONE_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "READY_FOR_INVOICING", label: "Ready for Invoicing" },
  { value: "INVOICED", label: "Invoiced" },
] as const;

export const INVOICE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
] as const;
