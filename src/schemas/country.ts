import { z } from "zod";

export const countryFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  code: z.string().trim().min(1, { error: "Code is required." }),
});

export type CountryFormData = z.infer<typeof countryFormSchema>;
