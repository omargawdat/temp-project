import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { ValidationError } from "@/lib/validation";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function handleImageUpload(
  formData: FormData,
  fieldName: string,
  folder: string,
  existingUrl?: string | null,
): Promise<string | null> {
  const file = formData.get(fieldName) as File | null;

  if (!file || file.size === 0) {
    return existingUrl ?? null;
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const filename = `${folder}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "images", folder);
  const filepath = path.join(dir, filename);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buffer);
  } catch {
    throw new ValidationError("Failed to save image. Please try again.");
  }

  // Delete old file if it exists and is a local path
  if (existingUrl && existingUrl.startsWith("/")) {
    const oldPath = path.join(process.cwd(), "public", existingUrl);
    try {
      await unlink(oldPath);
    } catch {
      // Ignore errors when deleting old file (may not exist)
    }
  }

  return `/images/${folder}/${filename}`;
}
