import { z } from "zod";

export const invoiceCreateSchema = z.object({
  milestoneIds: z
    .string()
    .trim()
    .min(1, { error: "At least one milestone is required." })
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .refine((ids) => ids.length > 0, { error: "At least one milestone is required." }),
  vatAmount: z
    .string()
    .trim()
    .min(1, { error: "VAT amount is required." })
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      error: "VAT amount must be a valid non-negative number.",
    }),
});

export const invoiceUpdateSchema = z.object({
  invoiceNumber: z.string().trim().min(1, { error: "Invoice number is required." }),
  vatAmount: z
    .string()
    .trim()
    .min(1, { error: "VAT amount is required." })
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      error: "VAT amount must be a valid non-negative number.",
    }),
});

export type InvoiceCreateData = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateData = z.infer<typeof invoiceUpdateSchema>;
