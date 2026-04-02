"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { DeliveryNoteStatus } from "@prisma/client";
import { DN_TRANSITIONS } from "@/schemas/transitions";
import { deliveryNoteFormSchema, deliveryNoteUpdateSchema } from "@/schemas/delivery-note";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { handleFileUpload } from "@/lib/file-upload";


export async function createDeliveryNote(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = deliveryNoteFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { projectId, milestoneId, description, workDelivered } = result.data;

    // Validate milestone if provided
    if (milestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { deliveryNote: true },
      });

      if (!milestone) {
        return { success: false, error: "Milestone not found." };
      }

      if (milestone.deliveryNote) {
        return { success: false, error: "A delivery note already exists for this milestone." };
      }
    }

    const deliveryNote = await prisma.deliveryNote.create({
      data: { projectId, milestoneId, description, workDelivered, status: "DRAFT" },
    });

    revalidateEntity("projects", projectId);
    return { success: true, data: { id: deliveryNote.id } };
  });
}

export async function updateDeliveryNote(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = deliveryNoteUpdateSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { description, workDelivered } = result.data;

    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id },
    });

    if (!deliveryNote) {
      return { success: false, error: "Delivery note not found." };
    }

    if (deliveryNote.status !== "DRAFT") {
      return { success: false, error: "Can only edit draft delivery notes." };
    }

    await prisma.deliveryNote.update({
      where: { id },
      data: { description, workDelivered },
    });

    revalidateEntity("projects", deliveryNote.projectId);
    return { success: true, data: { id } };
  });
}

export async function updateDeliveryNoteStatus(
  id: string,
  newStatus: DeliveryNoteStatus,
  formData?: FormData,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id },
    });

    if (!deliveryNote) {
      return { success: false, error: "Delivery note not found." };
    }

    const allowedTransitions = DN_TRANSITIONS[deliveryNote.status];
    if (!allowedTransitions.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${deliveryNote.status} to ${newStatus}.` };
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === DeliveryNoteStatus.SENT) updateData.sentDate = new Date();
    if (newStatus === DeliveryNoteStatus.SIGNED) {
      updateData.signedDate = new Date();

      const file = formData?.get("signedDocument") as File | null;
      if (!file || file.size === 0) {
        return { success: false, error: "A signed document file is required." };
      }
      const result = await handleFileUpload(file, "delivery-notes");
      updateData.signedDocumentUrl = result.url;
    }

    await prisma.deliveryNote.update({ where: { id }, data: updateData });

    revalidateEntity("projects", deliveryNote.projectId);
    return { success: true, data: undefined };
  });
}
