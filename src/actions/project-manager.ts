"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { handleImageUpload } from "@/lib/image-upload";
import type { ActionResult } from "@/types";
import { projectManagerFormSchema } from "@/schemas/project-manager";
import { validateFormData } from "@/lib/form-utils";


export async function createProjectManager(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(projectManagerFormSchema, formData);
    if (!validated.success) return validated;

    const { name, email, phone, title } = validated.data;

    const existing = await prisma.projectManager.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        error: "A project manager with this email already exists.",
        fieldErrors: { email: ["A project manager with this email already exists."] },
      };
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
    const validated = validateFormData(projectManagerFormSchema, formData);
    if (!validated.success) return validated;

    const { name, email, phone, title } = validated.data;

    const existing = await prisma.projectManager.findFirst({
      where: { email, id: { not: id } },
    });
    if (existing) {
      return {
        success: false,
        error: "Another project manager with this email already exists.",
        fieldErrors: { email: ["Another project manager with this email already exists."] },
      };
    }

    const currentPm = await prisma.projectManager.findUnique({ where: { id } });
    if (!currentPm) {
      return { success: false, error: "Project manager not found." };
    }
    const photoUrl = await handleImageUpload(formData, "photo", "team", currentPm.photoUrl);

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
      return { success: false, error: "Project manager not found." };
    }

    if (pm._count.projects > 0) {
      return {
        success: false,
        error: `Cannot delete. ${pm.name} is assigned to ${pm._count.projects} project(s).`,
      };
    }

    await prisma.projectManager.delete({ where: { id } });

    revalidateEntity("project-managers");
    return { success: true, data: undefined };
  });
}
