import { z } from "zod";
import { ClientSector } from "@prisma/client";

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),

  sector: z.enum(ClientSector, {
    error: "Sector must be one of: Government, Private, Semi Government.",
  }),
  countryId: z.string().trim().min(1, { error: "Country is required." }),
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
