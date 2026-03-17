"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import {
  parseRequiredString,
  parseOptionalString,
  parseEnum,
  validateEmail,
  ValidationError,
} from "@/lib/validation";
import { handleImageUpload } from "@/lib/image-upload";
import type { ActionResult } from "@/types";

function parseClientFields(formData: FormData) {
  const name = parseRequiredString(formData, "name");
  const code = parseRequiredString(formData, "code");
  const sector = parseEnum(formData, "sector", [
    "GOVERNMENT",
    "PRIVATE",
    "SEMI_GOVERNMENT",
  ] as const);
  const countryId = parseRequiredString(formData, "countryId");
  const primaryContact = parseRequiredString(formData, "primaryContact");
  const financeContact = parseRequiredString(formData, "financeContact");
  const email = parseRequiredString(formData, "email");
  validateEmail(email);
  const phone = parseRequiredString(formData, "phone");
  const billingAddress = parseRequiredString(formData, "billingAddress");
  const portalName = parseOptionalString(formData, "portalName");
  const portalLink = parseOptionalString(formData, "portalLink");
  const notes = parseOptionalString(formData, "notes");

  return {
    name,
    code,
    sector,
    countryId,
    primaryContact,
    financeContact,
    email,
    phone,
    billingAddress,
    portalName,
    portalLink,
    notes,
  };
}

export async function createClient(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const fields = parseClientFields(formData);
    const imageUrl = await handleImageUpload(formData, "image", "clients");

    const existing = await prisma.client.findUnique({
      where: { code: fields.code },
    });
    if (existing) {
      throw new ValidationError("A client with this code already exists.");
    }

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
    const fields = parseClientFields(formData);
    const current = await prisma.client.findUnique({ where: { id } });
    if (!current) throw new ValidationError("Client not found.");

    const imageUrl = await handleImageUpload(formData, "image", "clients", current.imageUrl);

    const existing = await prisma.client.findFirst({
      where: { code: fields.code, id: { not: id } },
    });
    if (existing) {
      throw new ValidationError(
        "Another client with this code already exists.",
      );
    }

    await prisma.client.update({
      where: { id },
      data: { ...fields, imageUrl },
    });

    revalidateEntity("clients", id);
    return { success: true, data: { id } };
  });
}
