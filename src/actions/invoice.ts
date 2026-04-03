"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { recalculateProjectStatus } from "./project";
import { InvoiceStatus } from "@prisma/client";
import { INVOICE_TRANSITIONS } from "@/schemas/transitions";
import { invoiceCreateSchema, invoiceUpdateSchema } from "@/schemas/invoice";
import { validateFormData, parseLocalDate } from "@/lib/form-utils";

export async function createInvoice(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(invoiceCreateSchema, formData);
    if (!validated.success) return validated;

    const { milestoneIds, vatAmount } = validated.data;

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

    // All must be COMPLETED
    const notReady = milestones.find((m) => m.status !== "COMPLETED");
    if (notReady) {
      return { success: false, error: `Milestone "${notReady.name}" is not completed.` };
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

    // Auto-calculate amount from milestone values (round to 2dp to avoid floating point drift)
    const amount = Math.round(milestones.reduce((sum, m) => sum + Number(m.value), 0) * 100) / 100;
    const vatNum = Math.round(Number(vatAmount) * 100) / 100;
    const totalPayable = Math.round((amount + vatNum) * 100) / 100;

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
    const validated = validateFormData(invoiceUpdateSchema, formData);
    if (!validated.success) return validated;

    const { invoiceNumber, vatAmount } = validated.data;

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

    const projectId = invoice.milestones[0].projectId;
    await recalculateProjectStatus(projectId);
    revalidateEntity("invoices");
    revalidateEntity("projects", projectId);

    return { success: true, data: undefined };
  });
}

export async function setInvoicePaymentDueDate(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const dateStr = formData.get("paymentDueDate") as string;
    if (!dateStr) {
      return { success: false, error: "Payment due date is required." };
    }

    const paymentDueDate = parseLocalDate(dateStr);
    if (isNaN(paymentDueDate.getTime())) {
      return { success: false, error: "Invalid date." };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { milestones: { select: { projectId: true } } },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status !== "DRAFT" && invoice.status !== "SUBMITTED") {
      return { success: false, error: "Can only set due date on draft or submitted invoices." };
    }

    await prisma.invoice.update({
      where: { id },
      data: { paymentDueDate },
    });

    const projectId = invoice.milestones[0]?.projectId;
    if (projectId) revalidateEntity("projects", projectId);
    revalidateEntity("invoices");

    return { success: true, data: undefined };
  });
}
