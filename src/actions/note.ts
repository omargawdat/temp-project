"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { parseRequiredString } from "@/lib/validation";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

function revalidateParent(entityType: string, entityId: string) {
  if (entityType === "CLIENT") {
    revalidatePath(`/clients/${entityId}`);
  } else if (entityType === "PROJECT") {
    revalidatePath(`/projects/${entityId}`);
  }
}

export async function createNote(
  entityType: string,
  entityId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const content = parseRequiredString(formData, "content");
    const createdBy = parseRequiredString(formData, "createdBy");

    const note = await prisma.note.create({
      data: { entityType, entityId, content, createdBy },
    });

    revalidateParent(entityType, entityId);
    return { success: true, data: { id: note.id } };
  });
}

export async function updateNote(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const content = parseRequiredString(formData, "content");

    const note = await prisma.note.update({
      where: { id },
      data: { content },
    });

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: { id: note.id } };
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return { success: true, data: undefined };
    }

    await prisma.note.delete({ where: { id } });

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: undefined };
  });
}