"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";

import type { ActionResult } from "@/types";
import { clientFormSchema } from "@/schemas/client";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";


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

    const client = await prisma.client.create({
      data: fields,
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

    await prisma.client.update({
      where: { id },
      data: fields,
    });

    revalidateEntity("clients", id);
    return { success: true, data: { id } };
  });
}
