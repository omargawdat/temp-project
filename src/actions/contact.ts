"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import type { ActionResult } from "@/types";
import { contactSchema } from "@/schemas/contact";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";

export async function createContact(
  entityType: string,
  entityId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = contactSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const contact = await prisma.contact.create({
      data: { ...result.data, entityType, entityId },
    });

    revalidateEntity(entityType === "Client" ? "clients" : "projects", entityId);
    return { success: true, data: { id: contact.id } };
  });
}

export async function updateContact(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = contactSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const current = await prisma.contact.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Contact not found." };
    }

    await prisma.contact.update({ where: { id }, data: result.data });

    revalidateEntity(
      current.entityType === "Client" ? "clients" : "projects",
      current.entityId,
    );
    return { success: true, data: { id } };
  });
}

export async function deleteContact(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const current = await prisma.contact.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Contact not found." };
    }

    await prisma.contact.delete({ where: { id } });

    revalidateEntity(
      current.entityType === "Client" ? "clients" : "projects",
      current.entityId,
    );
    return { success: true, data: undefined };
  });
}
