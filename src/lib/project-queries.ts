import type { Prisma, ProjectStatus, ProjectType } from "@prisma/client";

interface ProjectFilterParams {
  q?: string;
  status?: string;
  client?: string;
  pm?: string;
  type?: string;
}

interface ProjectSortParams {
  sort?: string;
  dir?: string;
}

export function buildProjectWhere(
  params: ProjectFilterParams,
): Prisma.ProjectWhereInput {
  const conditions: Prisma.ProjectWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q } },
        { client: { name: { contains: q } } },
        { contractNumber: { contains: q } },
      ],
    });
  }

  const statusFilter = params.status?.split(",").filter(Boolean) ?? [];
  if (statusFilter.length > 0) {
    conditions.push({ status: { in: statusFilter as ProjectStatus[] } });
  }

  const clientFilter = params.client?.split(",").filter(Boolean) ?? [];
  if (clientFilter.length > 0) {
    conditions.push({ clientId: { in: clientFilter } });
  }

  const pmFilter = params.pm?.split(",").filter(Boolean) ?? [];
  if (pmFilter.length > 0) {
    conditions.push({ projectManagerId: { in: pmFilter } });
  }

  const typeFilter = params.type?.split(",").filter(Boolean) ?? [];
  if (typeFilter.length > 0) {
    conditions.push({ type: { in: typeFilter as ProjectType[] } });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildProjectOrderBy(
  params: ProjectSortParams,
): Prisma.ProjectOrderByWithRelationInput {
  const dir = params.dir === "desc" ? "desc" : "asc";
  switch (params.sort) {
    case "name":
      return { name: dir };
    case "contractValue":
      return { contractValue: dir };
    case "startDate":
      return { startDate: dir };
    case "endDate":
      return { endDate: dir };
    case "status":
      return { status: dir };
    case "client":
      return { client: { name: dir } };
    default:
      return { updatedAt: "desc" };
  }
}

export function hasActiveProjectFilters(params: ProjectFilterParams): boolean {
  return !!(params.q?.trim() || params.status || params.client || params.pm || params.type);
}
