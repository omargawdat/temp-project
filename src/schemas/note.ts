import { z } from "zod";

const VALID_ENTITY_TYPES = ["CLIENT", "PROJECT", "PROJECT_MANAGER"] as const;
const VALID_NOTE_TYPES = ["GENERAL", "MEETING", "DECISION", "RISK", "ACTION", "FINANCE"] as const;

export const noteFormSchema = z.object({
  content: z.string().trim().min(1, { error: "Content is required." }),
  createdBy: z.string().trim().min(1, { error: "Created by is required." }),
  noteType: z.enum(VALID_NOTE_TYPES).optional().default("GENERAL"),
});

export const noteEntitySchema = z.object({
  entityType: z.enum(VALID_ENTITY_TYPES, {
    error: `Entity type must be one of: ${VALID_ENTITY_TYPES.join(", ")}.`,
  }),
  entityId: z.string().trim().min(1, { error: "Entity ID is required." }),
});

export const attachmentUrlSchema = z.object({
  url: z.string().url("Must be a valid URL."),
  filename: z.string().min(1).optional(),
});

export type NoteFormData = z.infer<typeof noteFormSchema>;
