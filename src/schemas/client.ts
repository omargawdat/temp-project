import { z } from "zod";
import { ClientSector } from "@prisma/client";

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  code: z.string().trim().min(1, { error: "Code is required." }),
  sector: z.enum(ClientSector, {
    error: "Sector must be one of: Government, Private, Semi Government.",
  }),
  countryId: z.string().trim().min(1, { error: "Country is required." }),
  primaryContact: z.string().trim().min(1, { error: "Primary contact is required." }),
  financeContact: z.string().trim().min(1, { error: "Finance contact is required." }),
  email: z
    .string()
    .trim()
    .min(1, { error: "Email is required." })
    .email({ error: "Please enter a valid email address." }),
  phone: z.string().trim().min(1, { error: "Phone is required." }),
  billingAddress: z.string().trim().min(1, { error: "Billing address is required." }),
  portalName: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  portalLink: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
