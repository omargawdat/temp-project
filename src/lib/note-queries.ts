import type { Prisma } from "@prisma/client";

interface NoteFilterParams {
  q?: string;
  noteType?: string;
  entityType?: string;
  createdBy?: string;
}

interface NoteSortParams {
  sort?: string;
  dir?: string;
}

export function buildNoteWhere(
  params: NoteFilterParams,
): Prisma.NoteWhereInput {
  const conditions: Prisma.NoteWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { content: { contains: q } },
        { createdBy: { contains: q } },
      ],
    });
  }

  const noteTypeFilter = params.noteType?.split(",").filter(Boolean) ?? [];
  if (noteTypeFilter.length > 0) {
    conditions.push({ noteType: { in: noteTypeFilter } });
  }

  const entityTypeFilter = params.entityType?.split(",").filter(Boolean) ?? [];
  if (entityTypeFilter.length > 0) {
    conditions.push({ entityType: { in: entityTypeFilter } });
  }

  const createdByFilter = params.createdBy?.split(",").filter(Boolean) ?? [];
  if (createdByFilter.length > 0) {
    conditions.push({ createdBy: { in: createdByFilter } });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildNoteOrderBy(
  params: NoteSortParams,
): Prisma.NoteOrderByWithRelationInput {
  const dir = params.dir === "asc" ? "asc" : "desc";
  switch (params.sort) {
    case "noteType":
      return { noteType: dir };
    case "createdBy":
      return { createdBy: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export function hasActiveNoteFilters(
  params: NoteFilterParams,
): boolean {
  return !!(
    params.q?.trim() ||
    params.noteType ||
    params.entityType ||
    params.createdBy
  );
}
