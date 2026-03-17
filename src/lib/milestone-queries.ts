import type { Prisma, MilestoneStatus } from "@prisma/client";

interface MilestoneFilterParams {
  q?: string;
  status?: string;
  project?: string;
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
  return !!(params.q?.trim() || params.status || params.project);
}
