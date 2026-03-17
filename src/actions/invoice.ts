"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { parseRequiredString, parseDecimal } from "@/lib/validation";
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
    const milestoneId = parseRequiredString(formData, "milestoneId");
    const invoiceNumber = parseRequiredString(formData, "invoiceNumber");
    const amount = parseDecimal(formData, "amount");
    const vatAmount = parseDecimal(formData, "vatAmount");
    const totalPayable = parseDecimal(formData, "totalPayable");

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { invoice: true, deliveryNote: true },
    });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    if (milestone.invoice) {
      return { success: false, error: "An invoice already exists for this milestone." };
    }

    if (milestone.status !== "READY_FOR_INVOICING") {
      return { success: false, error: "Milestone must be in Ready for Invoicing status." };
    }

    if (milestone.requiresDeliveryNote) {
      if (!milestone.deliveryNote || milestone.deliveryNote.status !== "SIGNED") {
        return { success: false, error: "Delivery note must be signed before creating an invoice." };
      }
    }

    const existingInvoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existingInvoice) {
      return { success: false, error: "Invoice number already exists." };
    }

    const invoice = await prisma.invoice.create({
      data: { milestoneId, invoiceNumber, amount, vatAmount, totalPayable, status: "DRAFT" },
    });

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "INVOICED" },
    });

    await recalculateProjectStatus(milestone.projectId);
    revalidateEntity("invoices");
    revalidateEntity("milestones");
    revalidateEntity("projects", milestone.projectId);

    return { success: true, data: { id: invoice.id } };
  });
}

export async function updateInvoice(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const invoiceNumber = parseRequiredString(formData, "invoiceNumber");
    const amount = parseDecimal(formData, "amount");
    const vatAmount = parseDecimal(formData, "vatAmount");
    const totalPayable = parseDecimal(formData, "totalPayable");

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status !== "DRAFT" && invoice.status !== "REJECTED") {
      return { success: false, error: "Can only edit draft or rejected invoices." };
    }

    await prisma.invoice.update({
      where: { id },
      data: { invoiceNumber, amount, vatAmount, totalPayable },
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
      include: { milestone: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
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

    await recalculateProjectStatus(invoice.milestone.projectId);
    revalidateEntity("invoices");
    revalidateEntity("projects", invoice.milestone.projectId);

    return { success: true, data: undefined };
  });
}
