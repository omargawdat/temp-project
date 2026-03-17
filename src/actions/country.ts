"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { parseRequiredString, ValidationError } from "@/lib/validation";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/types";
import { writeFile } from "fs/promises";
import path from "path";

async function handleFlagUpload(
  formData: FormData,
  existingFlag: string | null,
): Promise<string> {
  const file = formData.get("flagFile") as File | null;

  if (!file || file.size === 0) {
    if (existingFlag) return existingFlag;
    throw new ValidationError("Flag image is required.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`,
    );
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMB = MAX_PHOTO_SIZE_BYTES / (1024 * 1024);
    throw new ValidationError(`Flag image exceeds ${maxMB}MB.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "png";
  const filename = `flag-${Date.now()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "images", "flags", filename);

  try {
    await writeFile(filepath, buffer);
  } catch (error) {
    console.error("Failed to write flag file:", error);
    throw new ValidationError("Failed to save flag image. Please try again.");
  }

  return `/images/flags/${filename}`;
}

export async function createCountry(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const name = parseRequiredString(formData, "name");
    const code = parseRequiredString(formData, "code");
    const flag = await handleFlagUpload(formData, null);

    const existingName = await prisma.country.findUnique({ where: { name } });
    if (existingName) {
      throw new ValidationError("A country with this name already exists.");
    }

    const existingCode = await prisma.country.findUnique({ where: { code } });
    if (existingCode) {
      throw new ValidationError("A country with this code already exists.");
    }

    const country = await prisma.country.create({
      data: { name, code, flag },
    });

    revalidateEntity("countries");
    return { success: true, data: { id: country.id } };
  });
}

export async function updateCountry(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withErrorHandling(async () => {
    const name = parseRequiredString(formData, "name");
    const code = parseRequiredString(formData, "code");

    const current = await prisma.country.findUnique({ where: { id } });
    const flag = await handleFlagUpload(formData, current?.flag ?? null);

    const existingName = await prisma.country.findFirst({
      where: { name, id: { not: id } },
    });
    if (existingName) {
      throw new ValidationError("Another country with this name already exists.");
    }

    const existingCode = await prisma.country.findFirst({
      where: { code, id: { not: id } },
    });
    if (existingCode) {
      throw new ValidationError("Another country with this code already exists.");
    }

    await prisma.country.update({
      where: { id },
      data: { name, code, flag },
    });

    revalidateEntity("countries");
    return { success: true, data: { id } };
  });
}

export async function deleteCountry(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const country = await prisma.country.findUnique({
      where: { id },
      include: { _count: { select: { clients: true } } },
    });

    if (!country) {
      throw new ValidationError("Country not found.");
    }

    if (country._count.clients > 0) {
      throw new ValidationError(
        `Cannot delete. ${country.name} is referenced by ${country._count.clients} client(s).`,
      );
    }

    await prisma.country.delete({ where: { id } });

    revalidateEntity("countries");
    return { success: true, data: undefined };
  });
}
