import type { ActionResult } from "@/types";
import { ValidationError } from "./validation";
import { revalidatePath } from "next/cache";

export async function withErrorHandling<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
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
