"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { settingsFormSchema } from "@/schemas/settings";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";


export async function getCompanySettings() {
  return prisma.companySettings.findUnique({ where: { id: "default" } });
}

export async function updateCompanySettings(
  formData: FormData,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const result = settingsFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const data = result.data;

    await prisma.companySettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    revalidateEntity("settings");
    return { success: true, data: undefined };
  });
}
