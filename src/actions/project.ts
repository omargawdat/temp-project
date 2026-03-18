"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { handleImageUpload } from "@/lib/image-upload";
import { ProjectStatus } from "@prisma/client";
import { PROJECT_TRANSITIONS } from "@/schemas/transitions";
import { projectFormSchema } from "@/schemas/project";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";
import { createAuditLog, diffFields } from "@/lib/audit";

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
    void createAuditLog({
      action: "STATUS_CHANGE",
      entityType: "Project",
      entityId: projectId,
      entityName: project.name,
      changes: { before: { status: project.status }, after: { status: newStatus } },
      metadata: { trigger: "auto-recalculation" },
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

    void createAuditLog({
      action: "STATUS_CHANGE",
      entityType: "Project",
      entityId: id,
      entityName: project.name,
      changes: { before: { status: project.status }, after: { status: newStatus } },
    });

    revalidateEntity("projects", id);
    return { success: true, data: undefined };
  });
}

export async function createProject(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = projectFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const data = result.data;
    const imageUrl = await handleImageUpload(formData, "image", "projects");

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
        imageUrl,
        status: "ACTIVE",
      },
    });

    void createAuditLog({
      action: "CREATE",
      entityType: "Project",
      entityId: project.id,
      entityName: data.name,
    });

    revalidateEntity("projects");
    return { success: true, data: { id: project.id } };
  });
}

export async function updateProject(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = projectFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const data = result.data;

    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Project not found." };
    }

    const imageUrl = await handleImageUpload(formData, "image", "projects", current.imageUrl);

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
      data: { ...data, currency: data.currency.toUpperCase(), imageUrl },
    });

    void createAuditLog({
      action: "UPDATE",
      entityType: "Project",
      entityId: id,
      entityName: data.name,
      changes: diffFields(
        { name: current.name, contractNumber: current.contractNumber, contractValue: String(current.contractValue), currency: current.currency },
        { name: data.name, contractNumber: data.contractNumber, contractValue: String(data.contractValue), currency: data.currency.toUpperCase() },
      ),
    });

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

    void createAuditLog({
      action: "DELETE",
      entityType: "Project",
      entityId: id,
      entityName: project.name,
    });

    revalidateEntity("projects");
    redirect("/projects");
  });
}
