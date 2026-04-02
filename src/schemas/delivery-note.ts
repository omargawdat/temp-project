import { z } from "zod";

export const deliveryNoteFormSchema = z.object({
  projectId: z.string().trim().min(1, { error: "Project is required." }),
  milestoneId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  description: z.string().trim().min(1, { error: "Description is required." }),
  workDelivered: z.string().trim().min(1, { error: "Work delivered is required." }),
});

export const deliveryNoteUpdateSchema = deliveryNoteFormSchema.omit({ projectId: true, milestoneId: true });

export type DeliveryNoteFormData = z.infer<typeof deliveryNoteFormSchema>;
