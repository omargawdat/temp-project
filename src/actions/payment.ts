"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { parseRequiredString, parsePositiveDecimal, parseDate } from "@/lib/validation";
import { recalculateProjectStatus } from "./project";

export async function createPayment(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const invoiceId = parseRequiredString(formData, "invoiceId");
    const amount = parsePositiveDecimal(formData, "amount");
    const receivedDate = parseDate(formData, "receivedDate");
    const reference = parseRequiredString(formData, "reference");

    if (receivedDate > new Date()) {
      return { success: false, error: "Received date cannot be in the future." };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, milestone: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status !== "APPROVED") {
      return { success: false, error: "Can only add payments to approved invoices." };
    }

    const existingPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.totalPayable) - existingPaid;

    if (Number(amount) > remaining) {
      return { success: false, error: `Payment exceeds remaining balance of ${remaining.toFixed(2)}.` };
    }

    const payment = await prisma.payment.create({
      data: { invoiceId, amount, receivedDate, reference },
    });

    const totalPaid = existingPaid + Number(amount);
    if (totalPaid >= Number(invoice.totalPayable)) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });
    }

    await recalculateProjectStatus(invoice.milestone.projectId);
    revalidateEntity("invoices");
    revalidateEntity("projects", invoice.milestone.projectId);

    return { success: true, data: { id: payment.id } };
  });
}
