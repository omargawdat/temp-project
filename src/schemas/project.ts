import { z } from "zod";
import { ClientInvoicingMethod, ProjectType } from "@prisma/client";
import { parseLocalDate } from "@/lib/form-utils";

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Project name is required." }),
    clientId: z.string().trim().min(1, { error: "Client is required." }),
    contractNumber: z.string().trim().min(1, { error: "Contract number is required." }),
    contractValue: z
      .string()
      .trim()
      .min(1, { error: "Contract value is required." })
      .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
        error: "Contract value must be a valid non-negative number.",
      }),
    currency: z.string().trim().min(1, { error: "Currency is required." }),
    startDate: z
      .string()
      .trim()
      .min(1, { error: "Start date is required." })
      .transform((v) => parseLocalDate(v))
      .refine((d) => !isNaN(d.getTime()), { error: "Start date is not a valid date." }),
    endDate: z
      .string()
      .trim()
      .min(1, { error: "End date is required." })
      .transform((v) => parseLocalDate(v))
      .refine((d) => !isNaN(d.getTime()), { error: "End date is not a valid date." }),
    projectManagerId: z.string().trim().min(1, { error: "Project manager is required." }),
    paymentTerms: z.string().trim().min(1, { error: "Payment terms is required." }),
    clientInvoicingMethod: z.enum(ClientInvoicingMethod, {
      error: "Invoicing method must be one of: PORTAL, EMAIL.",
    }),
    type: z.enum(ProjectType, {
      error: "Type must be Project or Product.",
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    error: "End date must be after start date.",
    path: ["endDate"],
  });

export type ProjectFormData = z.infer<typeof projectFormSchema>;
