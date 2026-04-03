"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";

import type { ActionResult } from "@/types";
import { clientFormSchema } from "@/schemas/client";
import { contactsArraySchema } from "@/schemas/contact";
import { validateFormData } from "@/lib/form-utils";


export async function createClient(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(clientFormSchema, formData);
    if (!validated.success) return validated;

    const contactsRaw = formData.get("contacts") as string | null;
    const contacts = contactsRaw ? contactsArraySchema.parse(JSON.parse(contactsRaw)) : [];

    const client = await prisma.client.create({
      data: validated.data,
    });

    if (contacts.length > 0) {
      await prisma.contact.createMany({
        data: contacts.map((c) => ({
          ...c,
          entityType: "Client",
          entityId: client.id,
        })),
      });
    }

    revalidateEntity("clients");
    return { success: true, data: { id: client.id } };
  });
}

export async function updateClient(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(clientFormSchema, formData);
    if (!validated.success) return validated;

    const current = await prisma.client.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Client not found." };
    }

    const contactsRaw = formData.get("contacts") as string | null;
    const contacts = contactsRaw ? contactsArraySchema.parse(JSON.parse(contactsRaw)) : [];

    await prisma.client.update({
      where: { id },
      data: validated.data,
    });

    // Replace all contacts for this client
    await prisma.contact.deleteMany({
      where: { entityType: "Client", entityId: id },
    });
    if (contacts.length > 0) {
      await prisma.contact.createMany({
        data: contacts.map((c) => ({
          ...c,
          entityType: "Client",
          entityId: id,
        })),
      });
    }

    revalidateEntity("clients", id);
    return { success: true, data: { id } };
  });
}
