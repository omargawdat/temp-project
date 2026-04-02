import { prisma } from "@/lib/prisma";
import { buildClientWhere, buildClientOrderBy } from "@/lib/client-queries";
import { buildExportResponse } from "@/lib/export-utils";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  logger.info("API request", { route: "/api/clients/export", method: "GET" });
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

  const [clients, contacts] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      include: { country: true },
    }),
    prisma.contact.findMany({
      where: { entityType: "Client" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const contactsByClient = new Map<string, typeof contacts>();
  for (const c of contacts) {
    const list = contactsByClient.get(c.entityId) ?? [];
    list.push(c);
    contactsByClient.set(c.entityId, list);
  }

  const records = clients.map((c) => {
    const clientContacts = contactsByClient.get(c.id) ?? [];
    const contactStr = clientContacts
      .map((ct) => `${ct.name} (${ct.type}: ${ct.value})`)
      .join("; ");
    return {
      Name: c.name,
      Sector: c.sector.replace(/_/g, " "),
      Country: c.country.name,
      Contacts: contactStr,
      "Portal Name": c.portalName ?? "",
      "Portal Link": c.portalLink ?? "",
    };
  });

  return buildExportResponse(records, format, "clients");
}
