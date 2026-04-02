import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_ATTACHMENT_TYPES } from "@/lib/constants";
import { ValidationError } from "@/lib/validation";

export async function handleFileUpload(
  file: File,
  folder: string,
): Promise<{ url: string; filename: string; mimeType: string }> {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    throw new ValidationError(
      `File type "${file.type}" is not allowed.`,
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    const maxMB = MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024);
    throw new ValidationError(`File exceeds the maximum size of ${maxMB}MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "images", folder);
  const filepath = path.join(dir, uniqueName);

  await mkdir(dir, { recursive: true });
  await writeFile(filepath, buffer);

  return {
    url: `/images/${folder}/${uniqueName}`,
    filename: file.name,
    mimeType: file.type,
  };
}

export async function deleteLocalFile(url: string): Promise<void> {
  if (!url.startsWith("/images/")) return;
  const filePath = path.resolve(process.cwd(), "public", url.slice(1));
  const publicDir = path.resolve(process.cwd(), "public", "images");
  if (!filePath.startsWith(publicDir)) return;
  try {
    await unlink(filePath);
  } catch {
    // File may not exist
  }
}
