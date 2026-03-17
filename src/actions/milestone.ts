"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import {
  parseRequiredString,
  parseDecimal,
  parseDate,
  parseBoolean,
  ValidationError,
} from "@/lib/validation";
import { recalculateProjectStatus } from "./project";

const MILESTONE_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["READY_FOR_INVOICING"],
  READY_FOR_INVOICING: [], // INVOICED is set automatically by createInvoice
  INVOICED: [],
};

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
    const projectId = parseRequiredString(formData, "projectId");
    const name = parseRequiredString(formData, "name");
    const value = parseDecimal(formData, "value");
    const plannedDate = parseDate(formData, "plannedDate");
    const requiresDeliveryNote = parseBoolean(formData, "requiresDeliveryNote");

    // Value must be positive
    if (Number(value) <= 0) {
      throw new ValidationError("Milestone value must be greater than zero.");
    }

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
      throw new ValidationError(
        `Planned date must be between ${projectStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} and ${projectEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      );
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
    const name = parseRequiredString(formData, "name");
    const value = parseDecimal(formData, "value");
    const plannedDate = parseDate(formData, "plannedDate");
    const requiresDeliveryNote = parseBoolean(formData, "requiresDeliveryNote");

    // Value must be positive
    if (Number(value) <= 0) {
      throw new ValidationError("Milestone value must be greater than zero.");
    }

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
      throw new ValidationError(
        `Planned date must be between ${projectStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} and ${projectEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      );
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
  newStatus: string,
): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { deliveryNote: true },
    });

    if (!milestone) {
      return { success: false, error: "Milestone not found." };
    }

    // Validate transition is allowed
    const allowedTransitions = MILESTONE_TRANSITIONS[milestone.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${milestone.status} to ${newStatus}.`,
      };
    }

    // If moving to READY_FOR_INVOICING, check delivery note requirement
    if (newStatus === "READY_FOR_INVOICING" && milestone.requiresDeliveryNote) {
      if (!milestone.deliveryNote || milestone.deliveryNote.status !== "SIGNED") {
        return {
          success: false,
          error:
            "Delivery note must be signed before marking as ready for invoicing.",
        };
      }
    }

    await prisma.milestone.update({
      where: { id },
      data: { status: newStatus as "IN_PROGRESS" | "COMPLETED" | "READY_FOR_INVOICING" },
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
