"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/actions";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { noteFormSchema, noteEntitySchema } from "@/schemas/note";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { handleFileUpload, deleteLocalFile } from "@/lib/file-upload";


function revalidateParent(entityType: string, entityId: string) {
  if (entityType === "CLIENT") {
    revalidatePath(`/clients/${entityId}`);
  } else if (entityType === "PROJECT") {
    revalidatePath(`/projects/${entityId}`);
  } else if (entityType === "PROJECT_MANAGER") {
    revalidatePath(`/project-managers/${entityId}`);
  }
  revalidatePath("/notes");
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

    // Process file attachments
    const files = formData.getAll("attachmentFiles") as File[];
    for (const file of files) {
      if (file.size === 0) continue;
      const uploaded = await handleFileUpload(file, "notes");
      await prisma.noteAttachment.create({
        data: {
          noteId: note.id,
          type: "FILE",
          url: uploaded.url,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
        },
      });
    }

    // Process URL attachments
    const urls = formData.getAll("attachmentUrls") as string[];
    for (const url of urls) {
      if (!url.trim()) continue;
      await prisma.noteAttachment.create({
        data: {
          noteId: note.id,
          type: "URL",
          url: url.trim(),
          filename: url.trim(),
        },
      });
    }

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

    const data: { content: string; noteType?: string } = { content };
    const noteType = typeof raw.noteType === "string" ? raw.noteType.trim() : undefined;
    if (noteType) {
      data.noteType = noteType;
    }

    const note = await prisma.note.update({
      where: { id },
      data,
    });

    // Process new file attachments
    const files = formData.getAll("attachmentFiles") as File[];
    for (const file of files) {
      if (file.size === 0) continue;
      const uploaded = await handleFileUpload(file, "notes");
      await prisma.noteAttachment.create({
        data: {
          noteId: note.id,
          type: "FILE",
          url: uploaded.url,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
        },
      });
    }

    // Process new URL attachments
    const urls = formData.getAll("attachmentUrls") as string[];
    for (const url of urls) {
      if (!url.trim()) continue;
      await prisma.noteAttachment.create({
        data: {
          noteId: note.id,
          type: "URL",
          url: url.trim(),
          filename: url.trim(),
        },
      });
    }

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: { id: note.id } };
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const note = await prisma.note.findUnique({
      where: { id },
      include: { attachments: true },
    });
    if (!note) {
      return { success: false, error: "Note not found." };
    }

    // Delete local files
    for (const att of note.attachments) {
      if (att.type === "FILE") {
        await deleteLocalFile(att.url);
      }
    }

    await prisma.note.delete({ where: { id } });

    revalidateParent(note.entityType, note.entityId);
    return { success: true, data: undefined };
  });
}

export async function deleteNoteAttachment(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const attachment = await prisma.noteAttachment.findUnique({
      where: { id },
      include: { note: true },
    });
    if (!attachment) {
      return { success: false, error: "Attachment not found." };
    }

    if (attachment.type === "FILE") {
      await deleteLocalFile(attachment.url);
    }

    await prisma.noteAttachment.delete({ where: { id } });

    revalidateParent(attachment.note.entityType, attachment.note.entityId);
    return { success: true, data: undefined };
  });
}
