"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { DeliveryNoteStatus } from "@prisma/client";
import { DN_TRANSITIONS } from "@/schemas/transitions";
import { deliveryNoteFormSchema, deliveryNoteUpdateSchema } from "@/schemas/delivery-note";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { createAuditLog, diffFields } from "@/lib/audit";

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

    const { milestoneId, description, workDelivered } = result.data;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { deliveryNote: true },
    });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    if (!milestone.requiresDeliveryNote) {
      return { success: false, error: "This milestone does not require a delivery note." };
    }

    if (milestone.deliveryNote) {
      return { success: false, error: "A delivery note already exists for this milestone." };
    }

    if (milestone.status !== "COMPLETED" && milestone.status !== "READY_FOR_INVOICING") {
      return { success: false, error: "Milestone must be completed before creating a delivery note." };
    }

    const deliveryNote = await prisma.deliveryNote.create({
      data: { milestoneId, description, workDelivered, status: "DRAFT" },
    });

    void createAuditLog({
      action: "CREATE",
      entityType: "DeliveryNote",
      entityId: deliveryNote.id,
      entityName: `DN for ${milestone.name}`,
      metadata: { milestoneId, projectId: milestone.projectId },
    });

    revalidateEntity("projects", milestone.projectId);
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
      include: { milestone: true },
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

    void createAuditLog({
      action: "UPDATE",
      entityType: "DeliveryNote",
      entityId: id,
      entityName: `DN for ${deliveryNote.milestone.name}`,
      changes: diffFields(
        { description: deliveryNote.description, workDelivered: deliveryNote.workDelivered },
        { description, workDelivered },
      ),
      metadata: { milestoneId: deliveryNote.milestoneId, projectId: deliveryNote.milestone.projectId },
    });

    revalidateEntity("projects", deliveryNote.milestone.projectId);
    return { success: true, data: { id } };
  });
}

export async function updateDeliveryNoteStatus(
  id: string,
  newStatus: DeliveryNoteStatus,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id },
      include: { milestone: true },
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
    if (newStatus === DeliveryNoteStatus.SIGNED) updateData.signedDate = new Date();

    await prisma.deliveryNote.update({ where: { id }, data: updateData });

    void createAuditLog({
      action: "STATUS_CHANGE",
      entityType: "DeliveryNote",
      entityId: id,
      entityName: `DN for ${deliveryNote.milestone.name}`,
      changes: { before: { status: deliveryNote.status }, after: { status: newStatus } },
      metadata: { milestoneId: deliveryNote.milestoneId, projectId: deliveryNote.milestone.projectId },
    });

    revalidateEntity("projects", deliveryNote.milestone.projectId);
    return { success: true, data: undefined };
  });
}
