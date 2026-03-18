import type { Prisma } from "@prisma/client";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export {
  ProjectStatus,
  MilestoneStatus,
  DeliveryNoteStatus,
  InvoiceStatus,
  ClientInvoicingMethod,
} from "@prisma/client";

export type ProjectWithMilestones = Prisma.ProjectGetPayload<{
  include: { milestones: true };
}>;

export type ProjectWithFullDetails = Prisma.ProjectGetPayload<{
  include: {
    milestones: {
      include: {
        deliveryNote: true;
        invoice: { include: { payments: true } };
      };
    };
  };
}>;

export type MilestoneWithRelations = Prisma.MilestoneGetPayload<{
  include: { deliveryNote: true; invoice: true; project: true };
}>;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { payments: true; milestones: { include: { project: true } } };
}>;
