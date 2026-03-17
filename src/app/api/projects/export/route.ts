import { prisma } from "@/lib/prisma";
import { buildProjectWhere, buildProjectOrderBy } from "@/lib/project-queries";
import { buildExportResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    client: searchParams.get("client") ?? undefined,
    pm: searchParams.get("pm") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };
  const format = searchParams.get("format") ?? "csv";

  const where = buildProjectWhere(params);
  const orderBy = buildProjectOrderBy(sortParams);

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    include: {
      client: { select: { name: true } },
      projectManager: { select: { name: true } },
      milestones: { select: { id: true } },
    },
  });

  const records = projects.map((p) => ({
    Project: p.name,
    Client: p.client.name,
    "Contract #": p.contractNumber,
    "Contract Value": Number(p.contractValue),
    Currency: p.currency,
    "Start Date": new Date(p.startDate).toISOString().split("T")[0],
    "End Date": new Date(p.endDate).toISOString().split("T")[0],
    PM: p.projectManager.name,
    Status: p.status.replace(/_/g, " "),
  }));

  return buildExportResponse(records, format, "projects");
}
