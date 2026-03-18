import type { Prisma, AuditAction } from "@prisma/client";

interface AuditLogFilterParams {
  q?: string;
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AuditLogSortParams {
  sort?: string;
  dir?: string;
}

export function buildAuditLogWhere(
  params: AuditLogFilterParams,
): Prisma.AuditLogWhereInput {
  const conditions: Prisma.AuditLogWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { entityName: { contains: q } },
        { entityId: { contains: q } },
        { performedBy: { contains: q } },
      ],
    });
  }

  const entityTypeFilter = params.entityType?.split(",").filter(Boolean) ?? [];
  if (entityTypeFilter.length > 0) {
    conditions.push({ entityType: { in: entityTypeFilter } });
  }

  const actionFilter = params.action?.split(",").filter(Boolean) ?? [];
  if (actionFilter.length > 0) {
    conditions.push({ action: { in: actionFilter as AuditAction[] } });
  }

  if (params.dateFrom || params.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (params.dateFrom) {
      dateCondition.gte = new Date(params.dateFrom + "T00:00:00");
    }
    if (params.dateTo) {
      const nextDay = new Date(params.dateTo);
      nextDay.setDate(nextDay.getDate() + 1);
      dateCondition.lt = nextDay;
    }
    conditions.push({ createdAt: dateCondition });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildAuditLogOrderBy(
  params: AuditLogSortParams,
): Prisma.AuditLogOrderByWithRelationInput {
  const dir = params.dir === "asc" ? "asc" : "desc";
  switch (params.sort) {
    case "entityType":
      return { entityType: dir };
    case "entityName":
      return { entityName: dir };
    case "action":
      return { action: dir };
    case "performedBy":
      return { performedBy: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export function hasActiveAuditLogFilters(
  params: AuditLogFilterParams,
): boolean {
  return !!(
    params.q?.trim() ||
    params.entityType ||
    params.action ||
    params.dateFrom ||
    params.dateTo
  );
}
