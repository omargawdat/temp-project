import { prisma } from "@/lib/prisma";
import { buildMilestoneWhere, buildMilestoneOrderBy } from "@/lib/milestone-queries";

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    project: searchParams.get("project") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };

  const where = buildMilestoneWhere(params);
  const orderBy = buildMilestoneOrderBy(sortParams);

  const milestones = await prisma.milestone.findMany({
    where,
    orderBy,
    include: { project: { select: { name: true, client: { select: { name: true } } } } },
  });

  const headers = ["Milestone", "Project", "Client", "Value", "Planned Date", "Status", "DN Required"];
  const rows = milestones.map((m) => [
    escapeCSV(m.name),
    escapeCSV(m.project.name),
    escapeCSV(m.project.client.name),
    Number(m.value).toString(),
    new Date(m.plannedDate).toISOString().split("T")[0],
    m.status.replace(/_/g, " "),
    m.requiresDeliveryNote ? "Yes" : "No",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="milestones-${date}.csv"`,
    },
  });
}
