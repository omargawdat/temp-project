import type { ActionResult } from "@/types";
import { ValidationError } from "./validation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { zodErrorToFieldErrors } from "./form-utils";

export async function withErrorHandling<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: zodErrorToFieldErrors(error),
      };
    }
    console.error("Action error:", error);
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
