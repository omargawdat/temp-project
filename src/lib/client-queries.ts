import type { Prisma, ClientSector } from "@prisma/client";

interface ClientFilterParams {
  q?: string;
  sector?: string;
  country?: string;
}

interface ClientSortParams {
  sort?: string;
  dir?: string;
}

export function buildClientWhere(
  params: ClientFilterParams,
): Prisma.ClientWhereInput {
  const conditions: Prisma.ClientWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q } },
        { code: { contains: q } },
        { country: { name: { contains: q } } },
      ],
    });
  }

  const sectorFilter = params.sector?.split(",").filter(Boolean) ?? [];
  if (sectorFilter.length > 0) {
    conditions.push({ sector: { in: sectorFilter as ClientSector[] } });
  }

  const countryFilter = params.country?.split(",").filter(Boolean) ?? [];
  if (countryFilter.length > 0) {
    conditions.push({ countryId: { in: countryFilter } });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildClientOrderBy(
  params: ClientSortParams,
): Prisma.ClientOrderByWithRelationInput {
  const dir = params.dir === "desc" ? "desc" : "asc";
  switch (params.sort) {
    case "code":
      return { code: dir };
    case "country":
      return { country: { name: dir } };
    case "sector":
      return { sector: dir };
    case "name":
    default:
      return { name: dir };
  }
}

export function hasActiveClientFilters(params: ClientFilterParams): boolean {
  return !!(params.q?.trim() || params.sector || params.country);
}
