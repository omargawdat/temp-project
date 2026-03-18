import { z } from "zod";

export const deliveryNoteFormSchema = z.object({
  milestoneId: z.string().trim().min(1, { error: "Milestone is required." }),
  description: z.string().trim().min(1, { error: "Description is required." }),
  workDelivered: z.string().trim().min(1, { error: "Work delivered is required." }),
});

export const deliveryNoteUpdateSchema = deliveryNoteFormSchema.omit({ milestoneId: true });

export type DeliveryNoteFormData = z.infer<typeof deliveryNoteFormSchema>;
