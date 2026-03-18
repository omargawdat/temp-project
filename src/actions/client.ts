"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { handleImageUpload } from "@/lib/image-upload";
import type { ActionResult } from "@/types";
import { clientFormSchema } from "@/schemas/client";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { createAuditLog, diffFields } from "@/lib/audit";

export async function createClient(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = clientFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const fields = result.data;
    const imageUrl = await handleImageUpload(formData, "image", "clients");

    const existing = await prisma.client.findUnique({
      where: { code: fields.code },
    });
    if (existing) {
      return {
        success: false,
        error: "A client with this code already exists.",
        fieldErrors: { code: ["A client with this code already exists."] },
      };
    }

    const client = await prisma.client.create({
      data: { ...fields, imageUrl },
    });

    void createAuditLog({
      action: "CREATE",
      entityType: "Client",
      entityId: client.id,
      entityName: fields.name,
    });

    revalidateEntity("clients");
    return { success: true, data: { id: client.id } };
  });
}

export async function updateClient(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = clientFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const fields = result.data;
    const current = await prisma.client.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Client not found." };
    }

    const imageUrl = await handleImageUpload(formData, "image", "clients", current.imageUrl);

    const existing = await prisma.client.findFirst({
      where: { code: fields.code, id: { not: id } },
    });
    if (existing) {
      return {
        success: false,
        error: "Another client with this code already exists.",
        fieldErrors: { code: ["Another client with this code already exists."] },
      };
    }

    await prisma.client.update({
      where: { id },
      data: { ...fields, imageUrl },
    });

    void createAuditLog({
      action: "UPDATE",
      entityType: "Client",
      entityId: id,
      entityName: fields.name,
      changes: diffFields(
        { name: current.name, code: current.code, email: current.email, phone: current.phone },
        { name: fields.name, code: fields.code, email: fields.email, phone: fields.phone },
      ),
    });

    revalidateEntity("clients", id);
    return { success: true, data: { id } };
  });
}
