"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";

export async function getCompanySettings() {
  return prisma.companySettings.findUnique({ where: { id: "default" } });
}

export async function updateCompanySettings(
  formData: FormData,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const data = {
      companyName: (formData.get("companyName") as string)?.trim() || "",
      address: (formData.get("address") as string)?.trim() || "",
      city: (formData.get("city") as string)?.trim() || "",
      country: (formData.get("country") as string)?.trim() || "",
      taxId: (formData.get("taxId") as string)?.trim() || "",
      email: (formData.get("email") as string)?.trim() || "",
      phone: (formData.get("phone") as string)?.trim() || "",
      website: (formData.get("website") as string)?.trim() || "",
      bankName: (formData.get("bankName") as string)?.trim() || "",
      bankAccount: (formData.get("bankAccount") as string)?.trim() || "",
      bankIban: (formData.get("bankIban") as string)?.trim() || "",
      bankSwift: (formData.get("bankSwift") as string)?.trim() || "",
      invoiceFooter: (formData.get("invoiceFooter") as string)?.trim() || "",
    };

    await prisma.companySettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    revalidateEntity("settings");
    return { success: true, data: undefined };
  });
}
