"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import {
  parseRequiredString,
  parseOptionalString,
  validateEmail,
  ValidationError,
} from "@/lib/validation";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/types";
import { writeFile } from "fs/promises";
import path from "path";

async function handlePhotoUpload(
  formData: FormData,
  existingPhotoUrl: string | null,
): Promise<string | null> {
  const file = formData.get("photo") as File | null;

  if (!file || file.size === 0) {
    return existingPhotoUrl;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}.`,
    );
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMB = MAX_PHOTO_SIZE_BYTES / (1024 * 1024);
    throw new ValidationError(
      `Photo exceeds the maximum size of ${maxMB}MB.`,
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `pm-${Date.now()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "images", "team", filename);

  try {
    await writeFile(filepath, buffer);
  } catch (error) {
    console.error("Failed to write photo file:", error);
    throw new ValidationError("Failed to save photo. Please try again.");
  }

  return `/images/team/${filename}`;
}

function parseProjectManagerFields(formData: FormData) {
  const name = parseRequiredString(formData, "name");
  const email = parseRequiredString(formData, "email");
  validateEmail(email);
  const phone = parseOptionalString(formData, "phone");
  const title = parseOptionalString(formData, "title");
  return { name, email, phone, title };
}

export async function createProjectManager(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const { name, email, phone, title } = parseProjectManagerFields(formData);

    const existing = await prisma.projectManager.findUnique({ where: { email } });
    if (existing) {
      throw new ValidationError(
        "A project manager with this email already exists.",
      );
    }

    const photoUrl = await handlePhotoUpload(formData, null);

    const pm = await prisma.projectManager.create({
      data: { name, email, phone, title, photoUrl },
    });

    revalidateEntity("project-managers");
    return { success: true, data: { id: pm.id } };
  });
}

export async function updateProjectManager(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const { name, email, phone, title } = parseProjectManagerFields(formData);

    const existing = await prisma.projectManager.findFirst({
      where: { email, id: { not: id } },
    });
    if (existing) {
      throw new ValidationError(
        "Another project manager with this email already exists.",
      );
    }

    const currentPm = await prisma.projectManager.findUnique({ where: { id } });
    const photoUrl = await handlePhotoUpload(formData, currentPm?.photoUrl ?? null);

    await prisma.projectManager.update({
      where: { id },
      data: { name, email, phone, title, photoUrl },
    });

    revalidateEntity("project-managers", id);
    return { success: true, data: { id } };
  });
}

export async function deleteProjectManager(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const pm = await prisma.projectManager.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });

    if (!pm) {
      throw new ValidationError("Project manager not found.");
    }

    if (pm._count.projects > 0) {
      throw new ValidationError(
        `Cannot delete. ${pm.name} is assigned to ${pm._count.projects} project(s).`,
      );
    }

    await prisma.projectManager.delete({ where: { id } });

    revalidateEntity("project-managers");
    return { success: true, data: undefined };
  });
}
