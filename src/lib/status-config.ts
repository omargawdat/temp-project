/** Canonical style definitions for all entity statuses and client sectors. */

export interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  // Project statuses
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  ON_HOLD: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },

  // Milestone statuses
  NOT_STARTED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500 animate-pulse" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  READY_FOR_INVOICING: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  INVOICED: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500" },

  // Delivery note statuses
  DRAFT: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  SENT: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500" },
  SIGNED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },

  // Invoice statuses
  SUBMITTED: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  UNDER_REVIEW: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500 animate-pulse" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  PAID: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500" },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export const DEFAULT_STATUS_STYLE: StatusStyle = {
  bg: "bg-slate-100",
  text: "text-slate-500",
  dot: "bg-slate-400",
};

export const SECTOR_STYLES: Record<string, StatusStyle> = {
  GOVERNMENT: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  PRIVATE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  SEMI_GOVERNMENT: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
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
  { key: "CLOSED", label: "Closed", dot: "bg-slate-400" },
] as const;

export const PROJECT_TYPES = [
  { key: "PROJECT", label: "Project", dot: "bg-blue-400" },
  { key: "PRODUCT", label: "Product", dot: "bg-purple-400" },
] as const;

export const MILESTONE_STATUSES = [
  { key: "NOT_STARTED", label: "Not Started", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-400" },
  { key: "COMPLETED", label: "Completed", dot: "bg-emerald-400" },
  { key: "READY_FOR_INVOICING", label: "Ready for Invoicing", dot: "bg-purple-400" },
  { key: "INVOICED", label: "Invoiced", dot: "bg-indigo-400" },
] as const;

export const DELIVERY_NOTE_STATUSES = [
  { key: "DRAFT", label: "Draft", dot: "bg-slate-400" },
  { key: "SENT", label: "Sent", dot: "bg-sky-400" },
  { key: "SIGNED", label: "Signed", dot: "bg-emerald-400" },
] as const;

export const INVOICE_STATUSES = [
  { key: "DRAFT", label: "Draft", dot: "bg-slate-400" },
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

export const AUDIT_ACTION_STYLES: Record<string, StatusStyle> = {
  CREATE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  UPDATE: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  DELETE: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  STATUS_CHANGE: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
};

export const AUDIT_ACTION_STATUSES = [
  { key: "CREATE", label: "Create", dot: "bg-emerald-400" },
  { key: "UPDATE", label: "Update", dot: "bg-blue-400" },
  { key: "DELETE", label: "Delete", dot: "bg-red-400" },
  { key: "STATUS_CHANGE", label: "Status Change", dot: "bg-purple-400" },
] as const;

export const AUDIT_ENTITY_TYPES = [
  { id: "Project", name: "Project" },
  { id: "Client", name: "Client" },
  { id: "Milestone", name: "Milestone" },
  { id: "Invoice", name: "Invoice" },
  { id: "DeliveryNote", name: "Delivery Note" },
  { id: "Payment", name: "Payment" },
  { id: "ProjectManager", name: "Project Manager" },
  { id: "Country", name: "Country" },
  { id: "Note", name: "Note" },
  { id: "CompanySettings", name: "Settings" },
] as const;

export const NOTE_TYPE_STATUSES = [
  { key: "GENERAL", label: "General", dot: "bg-slate-400" },
  { key: "MEETING", label: "Meeting", dot: "bg-blue-400" },
  { key: "DECISION", label: "Decision", dot: "bg-purple-400" },
  { key: "RISK", label: "Risk", dot: "bg-red-400" },
  { key: "ACTION", label: "Action Item", dot: "bg-amber-400" },
  { key: "FINANCE", label: "Finance", dot: "bg-emerald-400" },
  { key: "FOLLOW_UP", label: "Follow Up", dot: "bg-cyan-400" },
] as const;

export const NOTE_TYPE_STYLES: Record<string, StatusStyle> = {
  GENERAL: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  MEETING: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  DECISION: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  RISK: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  ACTION: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  FINANCE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  FOLLOW_UP: { bg: "bg-cyan-50", text: "text-cyan-600", dot: "bg-cyan-500" },
};

export const NOTE_ENTITY_TYPES = [
  { id: "CLIENT", name: "Client" },
  { id: "PROJECT", name: "Project" },
  { id: "PROJECT_MANAGER", name: "Project Manager" },
] as const;
