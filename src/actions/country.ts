"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling, revalidateEntity } from "@/lib/actions";
import { ValidationError } from "@/lib/validation";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/types";
import { writeFile } from "fs/promises";
import path from "path";
import { countryFormSchema } from "@/schemas/country";
import { validateFormData } from "@/lib/form-utils";


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
  const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = MIME_TO_EXT[file.type] ?? "png";
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
    const validated = validateFormData(countryFormSchema, formData);
    if (!validated.success) return validated;

    const { name, code } = validated.data;
    const flag = await handleFlagUpload(formData, null);

    const existingName = await prisma.country.findUnique({ where: { name } });
    if (existingName) {
      return {
        success: false,
        error: "A country with this name already exists.",
        fieldErrors: { name: ["A country with this name already exists."] },
      };
    }

    const existingCode = await prisma.country.findUnique({ where: { code } });
    if (existingCode) {
      return {
        success: false,
        error: "A country with this code already exists.",
        fieldErrors: { code: ["A country with this code already exists."] },
      };
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
    const validated = validateFormData(countryFormSchema, formData);
    if (!validated.success) return validated;

    const { name, code } = validated.data;
    const current = await prisma.country.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Country not found." };
    }
    const flag = await handleFlagUpload(formData, current.flag);

    const existingName = await prisma.country.findFirst({
      where: { name, id: { not: id } },
    });
    if (existingName) {
      return {
        success: false,
        error: "Another country with this name already exists.",
        fieldErrors: { name: ["Another country with this name already exists."] },
      };
    }

    const existingCode = await prisma.country.findFirst({
      where: { code, id: { not: id } },
    });
    if (existingCode) {
      return {
        success: false,
        error: "Another country with this code already exists.",
        fieldErrors: { code: ["Another country with this code already exists."] },
      };
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
      return { success: false, error: "Country not found." };
    }

    if (country._count.clients > 0) {
      return {
        success: false,
        error: `Cannot delete. ${country.name} is referenced by ${country._count.clients} client(s).`,
      };
    }

    await prisma.country.delete({ where: { id } });

    revalidateEntity("countries");
    return { success: true, data: undefined };
  });
}
