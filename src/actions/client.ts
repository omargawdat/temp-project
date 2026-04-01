"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { handleImageUpload } from "@/lib/image-upload";
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
    const imageUrl = await handleImageUpload(formData, "image", "clients");


    const client = await prisma.client.create({
      data: { ...fields, imageUrl },
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


    await prisma.client.update({
      where: { id },
      data: { ...fields, imageUrl },
    });

    revalidateEntity("clients", id);
    return { success: true, data: { id } };
  });
}
