import { prisma } from "@/lib/prisma";
import { buildClientWhere, buildClientOrderBy } from "@/lib/client-queries";
import { buildExportResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = {
    q: searchParams.get("q") ?? undefined,
    sector: searchParams.get("sector") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };
  const format = searchParams.get("format") ?? "csv";

  const where = buildClientWhere(params);
  const orderBy = buildClientOrderBy(sortParams);

  const clients = await prisma.client.findMany({
    where,
    orderBy,
    include: { country: true },
  });

  const records = clients.map((c) => ({
    Name: c.name,
    Code: c.code,
    Sector: c.sector.replace(/_/g, " "),
    Country: c.country.name,
    "Primary Contact": c.primaryContact,
    "Finance Contact": c.financeContact,
    Email: c.email,
    Phone: c.phone,
    "Portal Name": c.portalName ?? "",
    "Portal Link": c.portalLink ?? "",
  }));

  return buildExportResponse(records, format, "clients");
}
