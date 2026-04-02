import type { Prisma, DeliveryNoteStatus } from "@prisma/client";

interface DeliveryNoteFilterParams {
  q?: string;
  status?: string;
  project?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DeliveryNoteSortParams {
  sort?: string;
  dir?: string;
}

export function buildDeliveryNoteWhere(
  params: DeliveryNoteFilterParams,
): Prisma.DeliveryNoteWhereInput {
  const conditions: Prisma.DeliveryNoteWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { description: { contains: q } },
        { milestone: { name: { contains: q } } },
        { milestone: { project: { name: { contains: q } } } },
        { milestone: { project: { client: { name: { contains: q } } } } },
      ],
    });
  }

  const statusFilter = params.status?.split(",").filter(Boolean) ?? [];
  if (statusFilter.length > 0) {
    conditions.push({ status: { in: statusFilter as DeliveryNoteStatus[] } });
  }

  const projectFilter = params.project?.split(",").filter(Boolean) ?? [];
  if (projectFilter.length > 0) {
    conditions.push({ milestone: { projectId: { in: projectFilter } } });
  }

  // Date range filter on createdAt
  if (params.dateFrom || params.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (params.dateFrom) {
      dateCondition.gte = new Date(params.dateFrom + "T00:00:00");
    }
    if (params.dateTo) {
      dateCondition.lte = new Date(params.dateTo + "T23:59:59");
    }
    conditions.push({ createdAt: dateCondition });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildDeliveryNoteOrderBy(
  params: DeliveryNoteSortParams,
): Prisma.DeliveryNoteOrderByWithRelationInput {
  const dir = params.dir === "desc" ? "desc" : "asc";
  switch (params.sort) {
    case "milestone":
      return { milestone: { name: dir } };
    case "project":
      return { milestone: { project: { name: dir } } };
    case "status":
      return { status: dir };
    case "sentDate":
      return { sentDate: dir };
    case "signedDate":
      return { signedDate: dir };
    default:
      return { createdAt: "desc" };
  }
}

export function hasActiveDeliveryNoteFilters(
  params: DeliveryNoteFilterParams,
): boolean {
  return !!(
    params.q?.trim() ||
    params.status ||
    params.project ||
    params.dateFrom ||
    params.dateTo
  );
}