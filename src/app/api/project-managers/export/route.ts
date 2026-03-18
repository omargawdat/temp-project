import { prisma } from "@/lib/prisma";
import { buildPMWhere, sortPMStats } from "@/lib/pm-queries";
import { computePMStats } from "@/lib/pm-stats";
import { buildExportResponse } from "@/lib/export-utils";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  logger.info("API request", { route: "/api/project-managers/export", method: "GET" });
  const { searchParams } = new URL(request.url);
  const filterParams = {
    q: searchParams.get("q") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };
  const format = searchParams.get("format") ?? "csv";

  const where = buildPMWhere(filterParams);

  const managers = await prisma.projectManager.findMany({
    where,
    include: {
      projects: {
        include: {
          milestones: {
            include: {
              invoice: { select: { id: true, status: true, totalPayable: true } },
            },
          },
        },
      },
    },
  });

  const stats = computePMStats(managers);
  const sorted = sortPMStats(stats, sortParams);

  const records = sorted.map((pm) => ({
    Manager: pm.name,
    Title: pm.title ?? "",
    "Total Projects": pm.totalProjects,
    "Active Projects": pm.activeProjects,
    "Total Milestones": pm.totalMilestones,
    Completed: pm.completedMilestones,
    Overdue: pm.overdueMilestones,
    "Completion %": pm.completionPct,
    "Next Deadline": pm.nextDeadline
      ? new Date(pm.nextDeadline).toISOString().split("T")[0]
      : "",
    "Portfolio Value": pm.portfolioValue,
    "Billed Amount": pm.billed,
    "Billed %": pm.billedPct,
  }));

  return buildExportResponse(records, format, "project-managers");
}
