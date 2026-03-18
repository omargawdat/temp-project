import { z } from "zod";
import { parseLocalDate } from "@/lib/form-utils";

export const milestoneFormSchema = z.object({
  projectId: z.string().trim().min(1, { error: "Project is required." }),
  name: z.string().trim().min(1, { error: "Name is required." }),
  value: z
    .string()
    .trim()
    .min(1, { error: "Value is required." })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      error: "Value must be a positive number.",
    }),
  plannedDate: z
    .string()
    .trim()
    .min(1, { error: "Planned date is required." })
    .transform((v) => parseLocalDate(v))
    .refine((d) => !isNaN(d.getTime()), { error: "Planned date is not a valid date." }),
  requiresDeliveryNote: z.preprocess(
    (v) => v === "on" || v === "true" || v === "1",
    z.boolean(),
  ),
});

/** Schema for updating a milestone (no projectId needed). */
export const milestoneUpdateSchema = milestoneFormSchema.omit({ projectId: true });

export type MilestoneFormData = z.infer<typeof milestoneFormSchema>;
