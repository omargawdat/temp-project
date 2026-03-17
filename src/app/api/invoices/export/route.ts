import { prisma } from "@/lib/prisma";
import { buildInvoiceWhere, buildInvoiceOrderBy } from "@/lib/invoice-queries";
import { buildExportResponse } from "@/lib/export-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    project: searchParams.get("project") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  };
  const sortParams = {
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  };
  const format = searchParams.get("format") ?? "csv";

  const where = buildInvoiceWhere(params);
  const orderBy = buildInvoiceOrderBy(sortParams);

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy,
    include: {
      milestones: {
        include: { project: { select: { name: true } } },
      },
    },
  });

  const records = invoices.map((inv) => ({
    "Invoice #": inv.invoiceNumber,
    Project: inv.milestones[0]?.project.name ?? "—",
    Milestone:
      inv.milestones.length === 1
        ? inv.milestones[0].name
        : inv.milestones.length > 1
          ? `${inv.milestones[0].name} (+${inv.milestones.length - 1})`
          : "—",
    Amount: Number(inv.amount),
    VAT: Number(inv.vatAmount),
    "Total Payable": Number(inv.totalPayable),
    Status: inv.status.replace(/_/g, " "),
    "Due Date": inv.paymentDueDate
      ? new Date(inv.paymentDueDate).toISOString().split("T")[0]
      : "—",
  }));

  return buildExportResponse(records, format, "invoices");
}
