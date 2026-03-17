"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import {
  parseRequiredString,
  parseOptionalString,
  validateEmail,
  ValidationError,
} from "@/lib/validation";
import { handleImageUpload } from "@/lib/image-upload";
import type { ActionResult } from "@/types";

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

    const photoUrl = await handleImageUpload(formData, "photo", "team");

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
    const photoUrl = await handleImageUpload(formData, "photo", "team", currentPm?.photoUrl ?? null);

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
