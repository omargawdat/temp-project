"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { recalculateProjectStatus } from "./project";
import { InvoiceStatus } from "@prisma/client";
import { INVOICE_TRANSITIONS } from "@/schemas/transitions";
import { invoiceCreateSchema, invoiceUpdateSchema } from "@/schemas/invoice";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { createAuditLog, diffFields } from "@/lib/audit";

export async function createInvoice(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = invoiceCreateSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { milestoneIds, vatAmount } = result.data;

    const milestones = await prisma.milestone.findMany({
      where: { id: { in: milestoneIds } },
      include: { deliveryNote: true, project: true },
    });

    if (milestones.length !== milestoneIds.length) {
      return { success: false, error: "One or more milestones not found." };
    }

    // All must be from the same project
    const projectIds = new Set(milestones.map((m) => m.projectId));
    if (projectIds.size > 1) {
      return { success: false, error: "All milestones must belong to the same project." };
    }
    const projectId = milestones[0].projectId;

    // All must be READY_FOR_INVOICING
    const notReady = milestones.find((m) => m.status !== "READY_FOR_INVOICING");
    if (notReady) {
      return { success: false, error: `Milestone "${notReady.name}" is not ready for invoicing.` };
    }

    // None can already have an invoice
    const alreadyInvoiced = milestones.find((m) => m.invoiceId);
    if (alreadyInvoiced) {
      return { success: false, error: `Milestone "${alreadyInvoiced.name}" already has an invoice.` };
    }

    // Check delivery note requirements
    for (const m of milestones) {
      if (m.requiresDeliveryNote) {
        if (!m.deliveryNote || m.deliveryNote.status !== "SIGNED") {
          return { success: false, error: `Delivery note for "${m.name}" must be signed before invoicing.` };
        }
      }
    }

    // Auto-calculate amount from milestone values
    const amount = milestones.reduce((sum, m) => sum + Number(m.value), 0);
    const vatNum = Number(vatAmount);
    const totalPayable = amount + vatNum;

    // Generate invoice number + create invoice + link milestones atomically
    const invoice = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const lastInvoice = await tx.invoice.findFirst({
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
      const lastNum = lastInvoice
        ? parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10)
        : 0;
      const invoiceNumber = `INV-${year}-${String(lastNum + 1).padStart(3, "0")}`;

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          amount,
          vatAmount,
          totalPayable,
          status: "DRAFT",
        },
      });

      await tx.milestone.updateMany({
        where: { id: { in: milestoneIds } },
        data: { invoiceId: created.id, status: "INVOICED" },
      });

      return created;
    });

    void createAuditLog({
      action: "CREATE",
      entityType: "Invoice",
      entityId: invoice.id,
      entityName: invoice.invoiceNumber,
      metadata: { projectId, milestoneCount: milestoneIds.length, amount: String(amount) },
    });

    await recalculateProjectStatus(projectId);
    revalidateEntity("invoices");
    revalidateEntity("milestones");
    revalidateEntity("projects", projectId);

    return { success: true, data: { id: invoice.id } };
  });
}

export async function updateInvoice(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = invoiceUpdateSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { invoiceNumber, vatAmount } = result.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { milestones: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status !== "DRAFT" && invoice.status !== "REJECTED") {
      return { success: false, error: "Can only edit draft or rejected invoices." };
    }

    // Recalculate amount from linked milestones
    const amount = invoice.milestones.reduce((sum, m) => sum + Number(m.value), 0);
    const vatNum = Number(vatAmount);
    const totalPayable = amount + vatNum;

    // Invoice number uniqueness (if changed)
    if (invoiceNumber !== invoice.invoiceNumber) {
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
      if (existing) {
        return {
          success: false,
          error: "Invoice number already exists.",
          fieldErrors: { invoiceNumber: ["Invoice number already exists."] },
        };
      }
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        amount,
        vatAmount,
        totalPayable,
      },
    });

    void createAuditLog({
      action: "UPDATE",
      entityType: "Invoice",
      entityId: id,
      entityName: invoiceNumber,
      changes: diffFields(
        { invoiceNumber: invoice.invoiceNumber, vatAmount: String(invoice.vatAmount) },
        { invoiceNumber, vatAmount: String(vatAmount) },
      ),
    });

    revalidateEntity("invoices");
    return { success: true, data: { id } };
  });
}

export async function updateInvoiceStatus(
  id: string,
  newStatus: InvoiceStatus,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { milestones: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.milestones.length === 0) {
      return { success: false, error: "Invoice has no linked milestones." };
    }

    const allowedTransitions = INVOICE_TRANSITIONS[invoice.status];
    if (!allowedTransitions.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${invoice.status} to ${newStatus}.` };
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === InvoiceStatus.SUBMITTED) {
      if (!invoice.paymentDueDate) {
        return { success: false, error: "Payment due date must be set before submitting." };
      }
      updateData.submittedDate = new Date();
    }

    if (newStatus === InvoiceStatus.DRAFT) {
      updateData.submittedDate = null;
    }

    await prisma.invoice.update({ where: { id }, data: updateData });

    void createAuditLog({
      action: "STATUS_CHANGE",
      entityType: "Invoice",
      entityId: id,
      entityName: invoice.invoiceNumber,
      changes: { before: { status: invoice.status }, after: { status: newStatus } },
    });

    const projectId = invoice.milestones[0].projectId;
    await recalculateProjectStatus(projectId);
    revalidateEntity("invoices");
    revalidateEntity("projects", projectId);

    return { success: true, data: undefined };
  });
}
