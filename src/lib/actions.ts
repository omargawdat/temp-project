import type { ActionResult } from "@/types";
import { ValidationError } from "./validation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { zodErrorToFieldErrors } from "./form-utils";
import { logger } from "./logger";

export async function withErrorHandling<T>(
  fn: () => Promise<ActionResult<T>>,
  meta?: { action?: string; entityType?: string },
): Promise<ActionResult<T>> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info("Action completed", {
      ...meta,
      success: result.success,
      durationMs: Date.now() - start,
    });
    return result;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ValidationError) {
      logger.warn("Validation error", { ...meta, error: error.message, durationMs: Date.now() - start });
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      logger.warn("Zod validation error", { ...meta, durationMs: Date.now() - start });
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: zodErrorToFieldErrors(error),
      };
    }
    logger.error("Action error", {
      ...meta,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - start,
    });
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export function revalidateEntity(entity: string, id?: string): void {
  revalidatePath(`/${entity}`);
  if (id) {
    revalidatePath(`/${entity}/${id}`);
  }
}
