import { z } from "zod";

export const projectManagerFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  email: z
    .string()
    .trim()
    .min(1, { error: "Email is required." })
    .email({ error: "Please enter a valid email address." }),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  title: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export type ProjectManagerFormData = z.infer<typeof projectManagerFormSchema>;
