import type { Prisma } from "@prisma/client";
import type { PMStats } from "@/lib/pm-stats";

interface PMFilterParams {
  q?: string;
}

interface PMSortParams {
  sort?: string;
  dir?: string;
}

export function buildPMWhere(params: PMFilterParams): Prisma.ProjectManagerWhereInput {
  const q = params.q?.trim();
  if (!q) return {};

  return {
    OR: [
      { name: { contains: q } },
      { title: { contains: q } },
    ],
  };
}

export function sortPMStats(stats: PMStats[], params: PMSortParams): PMStats[] {
  const dir = params.dir === "desc" ? -1 : 1;
  const sorted = [...stats];

  switch (params.sort) {
    case "projects":
      sorted.sort((a, b) => (a.totalProjects - b.totalProjects) * dir);
      break;
    case "milestones":
      sorted.sort((a, b) => (a.completionPct - b.completionPct) * dir);
      break;
    case "nextDeadline": {
      sorted.sort((a, b) => {
        const aTime = a.nextDeadline ? new Date(a.nextDeadline).getTime() : null;
        const bTime = b.nextDeadline ? new Date(b.nextDeadline).getTime() : null;
        // Nulls last regardless of direction
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return (aTime - bTime) * dir;
      });
      break;
    }
    case "portfolio":
      sorted.sort((a, b) => (a.portfolioValue - b.portfolioValue) * dir);
      break;
    case "billed":
      sorted.sort((a, b) => (a.billed - b.billed) * dir);
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name) * dir);
      break;
  }

  return sorted;
}

export function hasActivePMFilters(params: PMFilterParams): boolean {
  return !!params.q?.trim();
}
