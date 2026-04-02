import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, { error: "Contact name is required." }),
  type: z.enum(["EMAIL", "PHONE"], { error: "Type must be EMAIL or PHONE." }),
  value: z.string().trim().min(1, { error: "Contact value is required." }),
});

export const contactsArraySchema = z.array(contactSchema);

export type ContactFormData = z.infer<typeof contactSchema>;
