import {
  ProjectStatus,
  MilestoneStatus,
  InvoiceStatus,
  DeliveryNoteStatus,
} from "@prisma/client";

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.ACTIVE]: [ProjectStatus.ON_HOLD, ProjectStatus.CLOSED],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.ACTIVE],
  [ProjectStatus.CLOSED]: [ProjectStatus.ACTIVE],
};

export const MILESTONE_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  [MilestoneStatus.NOT_STARTED]: [MilestoneStatus.IN_PROGRESS],
  [MilestoneStatus.IN_PROGRESS]: [MilestoneStatus.COMPLETED],
  [MilestoneStatus.COMPLETED]: [MilestoneStatus.READY_FOR_INVOICING],
  [MilestoneStatus.READY_FOR_INVOICING]: [], // INVOICED is set automatically by createInvoice
  [MilestoneStatus.INVOICED]: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.SUBMITTED],
  [InvoiceStatus.SUBMITTED]: [InvoiceStatus.UNDER_REVIEW, InvoiceStatus.REJECTED],
  [InvoiceStatus.UNDER_REVIEW]: [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED],
  [InvoiceStatus.APPROVED]: [], // PAID is set automatically by createPayment
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.REJECTED]: [InvoiceStatus.DRAFT],
};

export const DN_TRANSITIONS: Record<DeliveryNoteStatus, DeliveryNoteStatus[]> = {
  [DeliveryNoteStatus.DRAFT]: [DeliveryNoteStatus.SENT],
  [DeliveryNoteStatus.SENT]: [DeliveryNoteStatus.SIGNED],
  [DeliveryNoteStatus.SIGNED]: [],
};
