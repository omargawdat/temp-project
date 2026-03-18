import { z } from "zod";
import { parseLocalDate } from "@/lib/form-utils";

export const paymentFormSchema = z.object({
  invoiceId: z.string().trim().min(1, { error: "Invoice is required." }),
  amount: z
    .string()
    .trim()
    .min(1, { error: "Amount is required." })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      error: "Amount must be a positive number.",
    }),
  receivedDate: z
    .string()
    .trim()
    .min(1, { error: "Received date is required." })
    .transform((v) => parseLocalDate(v))
    .refine((d) => !isNaN(d.getTime()), { error: "Received date is not a valid date." })
    .refine((d) => d <= new Date(), { error: "Received date cannot be in the future." }),
  reference: z.string().trim().min(1, { error: "Reference is required." }),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
