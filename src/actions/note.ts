"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { noteFormSchema, noteEntitySchema } from "@/schemas/note";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { createAuditLog } from "@/lib/audit";

function revalidateParent(entityType: string, entityId: string) {
  if (entityType === "CLIENT") {
    revalidatePath(`/clients/${entityId}`);
  } else if (entityType === "PROJECT") {
    revalidatePath(`/projects/${entityId}`);
  } else if (entityType === "PROJECT_MANAGER") {
    revalidatePath(`/project-managers/${entityId}`);
  }
}

async function validateEntityExists(entityType: string, entityId: string): Promise<boolean> {
  if (entityType === "CLIENT") {
    return !!(await prisma.client.findUnique({ where: { id: entityId }, select: { id: true } }));
  } else if (entityType === "PROJECT") {
    return !!(await prisma.project.findUnique({ where: { id: entityId }, select: { id: true } }));
  } else if (entityType === "PROJECT_MANAGER") {
    return !!(await prisma.projectManager.findUnique({ where: { id: entityId }, select: { id: true } }));
  }
  return false;
}

export async function createNote(
  entityType: string,
  entityId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const entityResult = noteEntitySchema.safeParse({ entityType, entityId });
    if (!entityResult.success) {
      return {
        success: false,
        error: "Invalid entity reference.",
        fieldErrors: zodErrorToFieldErrors(entityResult.error),
      };
    }

    const exists = await validateEntityExists(entityResult.data.entityType, entityResult.data.entityId);
    if (!exists) {
      return { success: false, error: "The referenced entity does not exist." };
    }

    const result = noteFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const note = await prisma.note.create({
      data: {
        entityType: entityResult.data.entityType,
        entityId: entityResult.data.entityId,
        ...result.data,
      },
    });

    void createAuditLog({
      action: "CREATE",
      entityType: "Note",
      entityId: note.id,
      entityName: `${entityResult.data.entityType} note`,
      metadata: { parentEntityType: entityResult.data.entityType, parentEntityId: entityResult.data.entityId },
    });

    revalidateParent(entityResult.data.entityType, entityResult.data.entityId);
    return { success: true, data: { id: note.id } };
  });
}

export async function updateNote(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const raw = formDataToObject(formData);
    const content = typeof raw.content === "string" ? raw.content.trim() : "";
    if (!content) {
      return {
        success: false,
        error: "Content is required.",
        fieldErrors: { content: ["Content is required."] },
      };
    }

    const note = await prisma.note.update({
      where: { id },
      data: { content },
    });

    void createAuditLog({
      action: "UPDATE",
      entityType: "Note",
      entityId: id,
      entityName: `${note.entityType} note`,
    });

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: { id: note.id } };
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return { success: false, error: "Note not found." };
    }

    await prisma.note.delete({ where: { id } });

    void createAuditLog({
      action: "DELETE",
      entityType: "Note",
      entityId: id,
      entityName: `${note.entityType} note`,
    });

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: undefined };
  });
}
