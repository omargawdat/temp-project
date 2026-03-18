import { z } from "zod";

export const settingsFormSchema = z.object({
  companyName: z.string().trim().default(""),
  address: z.string().trim().default(""),
  city: z.string().trim().default(""),
  country: z.string().trim().default(""),
  taxId: z.string().trim().default(""),
  email: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      error: "Please enter a valid email address.",
    }),
  phone: z.string().trim().default(""),
  website: z.string().trim().default(""),
  bankName: z.string().trim().default(""),
  bankAccount: z.string().trim().default(""),
  bankIban: z.string().trim().default(""),
  bankSwift: z.string().trim().default(""),
  invoiceFooter: z.string().trim().default(""),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export type SettingsFormData = z.infer<typeof settingsFormSchema>;
