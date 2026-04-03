import type { FieldErrors, ActionResult } from "@/types";
import { z } from "zod";

/**
 * Converts FormData to a plain object for Zod parsing.
 * File inputs are excluded (handled separately by handleImageUpload).
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    obj[key] = value;
  }
  return obj;
}

/**
 * Converts a ZodError's issues into a per-field errors record.
 */
export function zodErrorToFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0]?.toString();
    if (field) {
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field]!.push(issue.message);
    }
  }
  return fieldErrors;
}

/**
 * Validates FormData against a Zod schema, returning an ActionResult.
 * On failure, returns a ready-to-return error with fieldErrors.
 * On success, returns the parsed data.
 */
export function validateFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): ActionResult<z.infer<T>> {
  const result = schema.safeParse(formDataToObject(formData));
  if (!result.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: zodErrorToFieldErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Parses a date-only string ("YYYY-MM-DD") as a local date to avoid timezone issues.
 */
export function parseLocalDate(value: string): Date {
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) {
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  }
  return new Date(value);
}
