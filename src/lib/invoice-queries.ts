import type { Prisma, InvoiceStatus } from "@prisma/client";

interface InvoiceFilterParams {
  q?: string;
  status?: string;
  project?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: string;
}

interface InvoiceSortParams {
  sort?: string;
  dir?: string;
}

export function buildInvoiceWhere(
  params: InvoiceFilterParams,
): Prisma.InvoiceWhereInput {
  const conditions: Prisma.InvoiceWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    conditions.push({
      OR: [
        { invoiceNumber: { contains: q } },
        { milestones: { some: { project: { name: { contains: q } } } } },
      ],
    });
  }

  const statusFilter = params.status?.split(",").filter(Boolean) ?? [];
  if (statusFilter.length > 0) {
    conditions.push({ status: { in: statusFilter as InvoiceStatus[] } });
  }

  const projectFilter = params.project?.split(",").filter(Boolean) ?? [];
  if (projectFilter.length > 0) {
    conditions.push({
      milestones: { some: { projectId: { in: projectFilter } } },
    });
  }

  // Overdue filter
  if (params.overdue === "true") {
    conditions.push({
      paymentDueDate: { lt: new Date() },
      status: { notIn: ["PAID", "REJECTED"] },
    });
  } else if (params.overdue === "false") {
    conditions.push({
      OR: [
        { paymentDueDate: null },
        { paymentDueDate: { gte: new Date() } },
        { status: { in: ["PAID", "REJECTED"] } },
      ],
    });
  }

  // Date range filter on paymentDueDate
  if (params.dateFrom || params.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (params.dateFrom) {
      dateCondition.gte = new Date(params.dateFrom + "T00:00:00");
    }
    if (params.dateTo) {
      dateCondition.lte = new Date(params.dateTo + "T23:59:59");
    }
    conditions.push({ paymentDueDate: dateCondition });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildInvoiceOrderBy(
  params: InvoiceSortParams,
): Prisma.InvoiceOrderByWithRelationInput {
  const dir = params.dir === "desc" ? "desc" : "asc";
  switch (params.sort) {
    case "invoiceNumber":
      return { invoiceNumber: dir };
    case "amount":
      return { amount: dir };
    case "totalPayable":
      return { totalPayable: dir };
    case "status":
      return { status: dir };
    case "paymentDueDate":
      return { paymentDueDate: dir };
    default:
      return { createdAt: "desc" };
  }
}

export function hasActiveInvoiceFilters(
  params: InvoiceFilterParams,
): boolean {
  return !!(
    params.q?.trim() ||
    params.status ||
    params.project ||
    params.dateFrom ||
    params.dateTo ||
    params.overdue
  );
}
