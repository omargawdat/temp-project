"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { ProjectStatus } from "@prisma/client";
import { PROJECT_TRANSITIONS } from "@/schemas/transitions";
import { projectFormSchema } from "@/schemas/project";
import { contactsArraySchema } from "@/schemas/contact";
import { validateFormData } from "@/lib/form-utils";

/**
 * Recalculates project status based on milestones and invoices.
 * - All milestones invoiced + all invoices paid → CLOSED
 * - Otherwise → ACTIVE
 */
export async function recalculateProjectStatus(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: {
        include: { invoice: true },
      },
    },
  });

  if (!project) return;

  if (project.milestones.length === 0) {
    if (project.status === "CLOSED") {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "ACTIVE" },
      });
    }
    return;
  }

  // Don't auto-override manual ON_HOLD status
  if (project.status === "ON_HOLD") return;

  const allInvoiced = project.milestones.every((m) => m.status === "INVOICED");
  const allPaid = project.milestones.every(
    (m) => m.invoice && m.invoice.status === "PAID",
  );

  let newStatus = project.status;

  if (allPaid && allInvoiced) {
    newStatus = "CLOSED";
  } else {
    newStatus = "ACTIVE";
  }

  if (newStatus !== project.status) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: newStatus },
    });
  }
}

export async function updateProjectStatus(
  id: string,
  newStatus: ProjectStatus,
): Promise<ActionResult<void>> {
  return withErrorHandling(async () => {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const allowed = PROJECT_TRANSITIONS[project.status];
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${project.status} to ${newStatus}.` };
    }

    await prisma.project.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidateEntity("projects", id);
    return { success: true, data: undefined };
  });
}

export async function createProject(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(projectFormSchema, formData);
    if (!validated.success) return validated;

    const data = validated.data;

    const contactsRaw = formData.get("contacts") as string | null;
    const contacts = contactsRaw ? contactsArraySchema.parse(JSON.parse(contactsRaw)) : [];

    const existing = await prisma.project.findUnique({
      where: { contractNumber: data.contractNumber },
    });
    if (existing) {
      return {
        success: false,
        error: "Contract number already exists.",
        fieldErrors: { contractNumber: ["Contract number already exists."] },
      };
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        currency: data.currency.toUpperCase(),
        status: "ACTIVE",
      },
    });

    if (contacts.length > 0) {
      await prisma.contact.createMany({
        data: contacts.map((c) => ({
          ...c,
          entityType: "Project",
          entityId: project.id,
        })),
      });
    }

    revalidateEntity("projects");
    return { success: true, data: { id: project.id } };
  });
}

export async function updateProject(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const validated = validateFormData(projectFormSchema, formData);
    if (!validated.success) return validated;

    const data = validated.data;

    const contactsRaw = formData.get("contacts") as string | null;
    const contacts = contactsRaw ? contactsArraySchema.parse(JSON.parse(contactsRaw)) : [];

    const existing = await prisma.project.findFirst({
      where: { contractNumber: data.contractNumber, id: { not: id } },
    });
    if (existing) {
      return {
        success: false,
        error: "Contract number already exists.",
        fieldErrors: { contractNumber: ["Contract number already exists."] },
      };
    }

    await prisma.project.update({
      where: { id },
      data: { ...data, currency: data.currency.toUpperCase() },
    });

    // Replace all contacts for this project
    await prisma.contact.deleteMany({
      where: { entityType: "Project", entityId: id },
    });
    if (contacts.length > 0) {
      await prisma.contact.createMany({
        data: contacts.map((c) => ({
          ...c,
          entityType: "Project",
          entityId: id,
        })),
      });
    }

    revalidateEntity("projects", id);
    return { success: true, data: { id } };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { milestones: true },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const hasStartedMilestones = project.milestones.some(
      (m) => m.status !== "NOT_STARTED",
    );

    if (project.status !== "CLOSED" && hasStartedMilestones) {
      return {
        success: false,
        error:
          "Cannot delete project with active milestones. Close the project first.",
      };
    }

    await prisma.project.delete({ where: { id } });

    revalidateEntity("projects");
    redirect("/projects");
  });
}
