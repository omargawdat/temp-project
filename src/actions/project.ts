"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import {
  parseRequiredString,
  parseDecimal,
  parseDate,
  parseEnum,
  validateDateRange,
  ValidationError,
} from "@/lib/validation";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { writeFile } from "fs/promises";
import path from "path";

const INVOICING_METHODS = ["PORTAL", "EMAIL"] as const;

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

  if (!project || project.milestones.length === 0) return;

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

const PROJECT_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["ON_HOLD", "CLOSED"],
  ON_HOLD: ["ACTIVE"],
  CLOSED: ["ACTIVE"],
};

export async function updateProjectStatus(
  id: string,
  newStatus: string,
): Promise<ActionResult<void>> {
  return withErrorHandling(async () => {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const allowed = PROJECT_TRANSITIONS[project.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${project.status} to ${newStatus}.` };
    }

    await prisma.project.update({
      where: { id },
      data: { status: newStatus as "ACTIVE" | "ON_HOLD" | "CLOSED" },
    });

    revalidateEntity("projects", id);
    return { success: true, data: undefined };
  });
}

async function handleProjectImage(
  formData: FormData,
  existingImageUrl: string | null,
): Promise<string | null> {
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    return existingImageUrl;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`,
    );
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMB = MAX_PHOTO_SIZE_BYTES / (1024 * 1024);
    throw new ValidationError(`Image exceeds the maximum size of ${maxMB}MB.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `project-${Date.now()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "images", "projects", filename);

  try {
    await writeFile(filepath, buffer);
  } catch {
    throw new ValidationError("Failed to save image. Please try again.");
  }

  return `/images/projects/${filename}`;
}

function validateProjectData(formData: FormData) {
  const name = parseRequiredString(formData, "name");
  const clientId = parseRequiredString(formData, "clientId");
  const contractNumber = parseRequiredString(formData, "contractNumber");
  const contractValue = parseDecimal(formData, "contractValue");
  const currency = parseRequiredString(formData, "currency");
  const startDate = parseDate(formData, "startDate");
  const endDate = parseDate(formData, "endDate");
  const projectManagerId = parseRequiredString(formData, "projectManagerId");
  const paymentTerms = parseRequiredString(formData, "paymentTerms");
  const clientInvoicingMethod = parseEnum(
    formData,
    "clientInvoicingMethod",
    INVOICING_METHODS,
  );

  validateDateRange(startDate, endDate);

  return {
    name,
    clientId,
    contractNumber,
    contractValue,
    currency: currency.toUpperCase(),
    startDate,
    endDate,
    projectManagerId,
    paymentTerms,
    clientInvoicingMethod,
  };
}

export async function createProject(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const data = validateProjectData(formData);
    const imageUrl = await handleProjectImage(formData, null);

    const existing = await prisma.project.findUnique({
      where: { contractNumber: data.contractNumber },
    });
    if (existing) {
      return { success: false, error: "Contract number already exists." };
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        imageUrl,
        status: "ACTIVE",
      },
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
    const data = validateProjectData(formData);

    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Project not found." };
    }

    const imageUrl = await handleProjectImage(formData, current.imageUrl);

    const existing = await prisma.project.findFirst({
      where: { contractNumber: data.contractNumber, id: { not: id } },
    });
    if (existing) {
      return { success: false, error: "Contract number already exists." };
    }

    await prisma.project.update({
      where: { id },
      data: { ...data, imageUrl },
    });

    revalidateEntity("projects", id);
    return { success: true, data: { id } };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
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
}
