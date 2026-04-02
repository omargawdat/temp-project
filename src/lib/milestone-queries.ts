import type { Prisma, MilestoneStatus } from "@prisma/client";

interface MilestoneFilterParams {
  q?: string;
  status?: string;
  project?: string;
  deliveryNote?: string;
  overdue?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface MilestoneSortParams {
  sort?: string;
  dir?: string;
}

export function buildMilestoneWhere(
  params: MilestoneFilterParams,
): Prisma.MilestoneWhereInput {
  const conditions: Prisma.MilestoneWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q } },
        { project: { name: { contains: q } } },
      ],
    });
  }

  const statusFilter = params.status?.split(",").filter(Boolean) ?? [];
  if (statusFilter.length > 0) {
    conditions.push({ status: { in: statusFilter as MilestoneStatus[] } });
  }

  const projectFilter = params.project?.split(",").filter(Boolean) ?? [];
  if (projectFilter.length > 0) {
    conditions.push({ projectId: { in: projectFilter } });
  }

  // Delivery note filter
  if (params.deliveryNote === "required") {
    conditions.push({ requiresDeliveryNote: true });
  } else if (params.deliveryNote === "not_required") {
    conditions.push({ requiresDeliveryNote: false });
  }

  // Overdue filter
  if (params.overdue === "true") {
    conditions.push({
      plannedDate: { lt: new Date() },
      status: { notIn: ["COMPLETED", "READY_FOR_INVOICING", "INVOICED"] },
    });
  } else if (params.overdue === "false") {
    conditions.push({
      OR: [
        { plannedDate: { gte: new Date() } },
        { status: { in: ["COMPLETED", "READY_FOR_INVOICING", "INVOICED"] } },
      ],
    });
  }

  // Date range filter
  if (params.dateFrom || params.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (params.dateFrom) {
      dateCondition.gte = new Date(params.dateFrom + "T00:00:00");
    }
    if (params.dateTo) {
      dateCondition.lte = new Date(params.dateTo + "T23:59:59");
    }
    conditions.push({ plannedDate: dateCondition });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildMilestoneOrderBy(
  params: MilestoneSortParams,
): Prisma.MilestoneOrderByWithRelationInput {
  const dir = params.dir === "desc" ? "desc" : "asc";
  switch (params.sort) {
    case "name":
      return { name: dir };
    case "value":
      return { value: dir };
    case "status":
      return { status: dir };
    case "project":
      return { project: { name: dir } };
    case "plannedDate":
    default:
      return { plannedDate: dir };
  }
}

export function hasActiveFilters(params: MilestoneFilterParams): boolean {
  return !!(params.q?.trim() || params.status || params.project || params.deliveryNote || params.overdue || params.dateFrom || params.dateTo);
}
