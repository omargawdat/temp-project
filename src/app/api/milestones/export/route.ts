import { prisma } from "@/lib/prisma";
import { buildMilestoneWhere, buildMilestoneOrderBy } from "@/lib/milestone-queries";
import { buildExportResponse } from "@/lib/export-utils";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  logger.info("API request", { route: "/api/milestones/export", method: "GET" });
  const { searchParams } = new URL(request.url);
  const params = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    project: searchParams.get("project") ?? undefined,
    deliveryNote: searchParams.get("deliveryNote") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };
  const format = searchParams.get("format") ?? "csv";

  const where = buildMilestoneWhere(params);
  const orderBy = buildMilestoneOrderBy(sortParams);

  const milestones = await prisma.milestone.findMany({
    where,
    orderBy,
    include: { project: { select: { name: true, currency: true, client: { select: { name: true } } } } },
  });

  const records = milestones.map((m) => ({
    Milestone: m.name,
    Project: m.project.name,
    Client: m.project.client.name,
    Value: Number(m.value),
    Currency: m.project.currency,
    "Planned Date": new Date(m.plannedDate).toISOString().split("T")[0],
    Status: m.status.replace(/_/g, " "),
    "DN Required": m.requiresDeliveryNote ? "Yes" : "No",
  }));

  return buildExportResponse(records, format, "milestones");
}
