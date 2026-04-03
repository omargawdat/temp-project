"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { ValidationError } from "@/lib/validation";
import { recalculateProjectStatus } from "./project";
import { MilestoneStatus } from "@prisma/client";
import { MILESTONE_TRANSITIONS } from "@/schemas/transitions";
import { milestoneFormSchema, milestoneUpdateSchema } from "@/schemas/milestone";
import { formDataToObject, zodErrorToFieldErrors } from "@/lib/form-utils";


function validateMilestoneValueWithinContract(
  newValue: number,
  otherMilestonesTotal: number,
  contractValue: number,
): void {
  const newTotal = otherMilestonesTotal + newValue;
  if (newTotal > contractValue) {
    throw new ValidationError(
      `Total milestone value (${newTotal.toLocaleString()}) would exceed contract value (${contractValue.toLocaleString()}).`,
    );
  }
}

export async function createMilestone(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = milestoneFormSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { projectId, name, value, plannedDate, requiresDeliveryNote } = result.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { milestones: true },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    if (project.status !== "ACTIVE") {
      return {
        success: false,
        error: "Can only add milestones to active projects.",
      };
    }

    // Validate planned date is within project timeline
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    if (plannedDate < projectStart || plannedDate > projectEnd) {
      return {
        success: false,
        error: `Planned date must be between ${projectStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} and ${projectEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
        fieldErrors: { plannedDate: [`Planned date must be within the project timeline.`] },
      };
    }

    const existingTotal = project.milestones.reduce(
      (sum, m) => sum + Number(m.value),
      0,
    );
    validateMilestoneValueWithinContract(
      Number(value),
      existingTotal,
      Number(project.contractValue),
    );

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name,
        value,
        plannedDate,
        requiresDeliveryNote,
        status: "NOT_STARTED",
      },
    });

    revalidateEntity("projects", projectId);
    revalidateEntity("milestones");

    return { success: true, data: { id: milestone.id } };
  });
}

export async function updateMilestone(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const result = milestoneUpdateSchema.safeParse(formDataToObject(formData));
    if (!result.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: zodErrorToFieldErrors(result.error),
      };
    }

    const { name, value, plannedDate, requiresDeliveryNote } = result.data;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { include: { milestones: true } } },
    });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    if (milestone.status === "INVOICED") {
      return { success: false, error: "Cannot update an invoiced milestone." };
    }

    // Validate planned date is within project timeline
    const projectStart = new Date(milestone.project.startDate);
    const projectEnd = new Date(milestone.project.endDate);
    if (plannedDate < projectStart || plannedDate > projectEnd) {
      return {
        success: false,
        error: `Planned date must be between ${projectStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} and ${projectEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
        fieldErrors: { plannedDate: [`Planned date must be within the project timeline.`] },
      };
    }

    const otherMilestonesTotal = milestone.project.milestones
      .filter((m) => m.id !== id)
      .reduce((sum, m) => sum + Number(m.value), 0);
    validateMilestoneValueWithinContract(
      Number(value),
      otherMilestonesTotal,
      Number(milestone.project.contractValue),
    );

    await prisma.milestone.update({
      where: { id },
      data: {
        name,
        value,
        plannedDate,
        requiresDeliveryNote,
      },
    });

    revalidateEntity("projects", milestone.projectId);
    revalidateEntity("milestones");

    return { success: true, data: { id } };
  });
}

export async function updateMilestoneStatus(
  id: string,
  newStatus: MilestoneStatus,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { deliveryNote: true },
    });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    const allowedTransitions = MILESTONE_TRANSITIONS[milestone.status];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${milestone.status} to ${newStatus}.`,
      };
    }

    await prisma.milestone.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidateEntity("projects", milestone.projectId);
    revalidateEntity("milestones");

    return { success: true, data: undefined };
  });
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const milestone = await prisma.milestone.findUnique({ where: { id } });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    if (
      milestone.status !== "NOT_STARTED" &&
      milestone.status !== "IN_PROGRESS"
    ) {
      return {
        success: false,
        error: "Can only delete milestones that are not started or in progress.",
      };
    }

    await prisma.milestone.delete({ where: { id } });

    await recalculateProjectStatus(milestone.projectId);

    revalidateEntity("projects", milestone.projectId);
    revalidateEntity("milestones");

    return { success: true, data: undefined };
  });
}
