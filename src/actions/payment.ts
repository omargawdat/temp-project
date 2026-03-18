"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { recalculateProjectStatus } from "./project";
import { paymentFormSchema } from "@/schemas/payment";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";

export async function createPayment(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = paymentFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { invoiceId, amount, receivedDate, reference } = result.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, milestones: true },
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
      return {
        success: false,
        error: `Payment exceeds remaining balance of ${remaining.toFixed(2)}.`,
        fieldErrors: { amount: [`Payment exceeds remaining balance of ${remaining.toFixed(2)}.`] },
      };
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: { invoiceId, amount, receivedDate, reference },
      });

      const totalPaid = existingPaid + Number(amount);
      if (totalPaid >= Number(invoice.totalPayable)) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" },
        });
      }

      return created;
    });

    const projectId = invoice.milestones[0]?.projectId;
    if (projectId) {
      await recalculateProjectStatus(projectId);
      revalidateEntity("projects", projectId);
    }
    revalidateEntity("invoices");

    return { success: true, data: { id: payment.id } };
  });
}
