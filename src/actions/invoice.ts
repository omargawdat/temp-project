"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import {
  parseRequiredString,
  parseDecimal,
  ValidationError,
} from "@/lib/validation";
import { recalculateProjectStatus } from "./project";

const INVOICE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [], // PAID is set automatically by createPayment
  PAID: [],
  REJECTED: ["DRAFT"],
};

export async function createInvoice(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const milestoneIdsRaw = parseRequiredString(formData, "milestoneIds");
    const vatAmount = parseDecimal(formData, "vatAmount");

    const milestoneIds = milestoneIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (milestoneIds.length === 0) {
      return { success: false, error: "At least one milestone is required." };
    }

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

    // Validate VAT is not negative
    if (vatNum < 0) {
      throw new ValidationError("VAT amount cannot be negative.");
    }

    // Calculate totalPayable = amount + VAT
    const totalPayable = amount + vatNum;

    // Generate invoice number: INV-YYYY-NNN
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    const lastNum = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10)
      : 0;
    const invoiceNumber = `INV-${year}-${String(lastNum + 1).padStart(3, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount: amount.toString(),
        vatAmount,
        totalPayable: totalPayable.toString(),
        status: "DRAFT",
      },
    });

    // Link milestones and set status to INVOICED
    await prisma.milestone.updateMany({
      where: { id: { in: milestoneIds } },
      data: { invoiceId: invoice.id, status: "INVOICED" },
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
    const invoiceNumber = parseRequiredString(formData, "invoiceNumber");
    const vatAmount = parseDecimal(formData, "vatAmount");

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

    if (vatNum < 0) {
      throw new ValidationError("VAT amount cannot be negative.");
    }

    const totalPayable = amount + vatNum;

    // Invoice number uniqueness (if changed)
    if (invoiceNumber !== invoice.invoiceNumber) {
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
      if (existing) {
        return { success: false, error: "Invoice number already exists." };
      }
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        amount: amount.toString(),
        vatAmount,
        totalPayable: totalPayable.toString(),
      },
    });

    revalidateEntity("invoices");
    return { success: true, data: { id } };
  });
}

export async function updateInvoiceStatus(
  id: string,
  newStatus: string,
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

    const allowedTransitions = INVOICE_TRANSITIONS[invoice.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${invoice.status} to ${newStatus}.` };
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "SUBMITTED") {
      if (!invoice.paymentDueDate) {
        return { success: false, error: "Payment due date must be set before submitting." };
      }
      updateData.submittedDate = new Date();
    }

    if (newStatus === "DRAFT") {
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
