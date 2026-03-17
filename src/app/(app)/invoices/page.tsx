import Link from "next/link";
import { FileText, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InvoicesToolbar } from "@/components/invoices/invoices-toolbar";
import {
  buildInvoiceWhere,
  buildInvoiceOrderBy,
  hasActiveInvoiceFilters,
} from "@/lib/invoice-queries";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    project: typeof params.project === "string" ? params.project : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildInvoiceWhere(filterParams);
  const orderBy = buildInvoiceOrderBy(sortParams);
  const filtersActive = hasActiveInvoiceFilters(filterParams);

  const [invoices, allProjects] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy,
      include: {
        milestones: {
          include: { project: true },
        },
      },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, imageUrl: true, _count: { select: { milestones: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} total`}
        breadcrumbs={[]}
      />

      {/* Toolbar */}
      <InvoicesToolbar
        projects={allProjects.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, count: p._count.milestones }))}
        resultCount={invoices.length}
      />

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="border-border/50 bg-accent/50 grid grid-cols-[110px_1fr_1fr_110px_70px_110px_130px_100px] gap-4 border-b px-6 py-3.5">
          <SortableHeader label="Invoice #" field="invoiceNumber" basePath="/invoices" defaultSort="createdAt" />
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Project
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Milestone
          </span>
          <SortableHeader label="Amount" field="amount" align="right" basePath="/invoices" defaultSort="createdAt" />
          <span className="text-muted-foreground text-right text-[11px] font-bold tracking-wider uppercase">
            VAT
          </span>
          <SortableHeader label="Total" field="totalPayable" align="right" basePath="/invoices" defaultSort="createdAt" />
          <SortableHeader label="Status" field="status" basePath="/invoices" defaultSort="createdAt" />
          <SortableHeader label="Due Date" field="paymentDueDate" basePath="/invoices" defaultSort="createdAt" />
        </div>

        <div className="divide-border/30 divide-y">
          {invoices.map((invoice) => (
            <a
              key={invoice.id}
              href={`/api/invoices/${invoice.id}/pdf`}
              download={`Invoice-${invoice.invoiceNumber}.pdf`}
              className="table-row-hover grid grid-cols-[110px_1fr_1fr_110px_70px_110px_130px_100px] items-center gap-4 px-6 py-4"
            >
              <span className="font-mono text-xs font-bold text-teal-400">
                {invoice.invoiceNumber}
              </span>
              <span className="text-foreground truncate text-sm">
                {invoice.milestones[0]?.project.name ?? "—"}
              </span>
              {invoice.milestones.length > 1 ? (
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground truncate text-xs text-left">
                    {`${invoice.milestones[0]?.name} (+${invoice.milestones.length - 1})`}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      {invoice.milestones.map((m) => (
                        <span key={m.id}>{m.name}</span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-muted-foreground truncate text-xs">
                  {invoice.milestones[0]?.name ?? "—"}
                </span>
              )}
              <span className="text-foreground text-right font-mono text-sm">
                $
                {Number(invoice.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-muted-foreground text-right font-mono text-xs">
                $
                {Number(invoice.vatAmount).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                })}
              </span>
              <span className="text-foreground text-right font-mono text-sm font-bold">
                $
                {Number(invoice.totalPayable).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <div>
                <StatusBadge status={invoice.status} />
              </div>
              <span className="text-muted-foreground text-xs">
                {invoice.paymentDueDate
                  ? new Date(invoice.paymentDueDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : "—"}
              </span>
            </a>
          ))}
        </div>

        {invoices.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-500/10" : "bg-teal-500/10"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <FileText className="h-8 w-8 text-teal-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                {filtersActive ? "No invoices match your filters" : "No invoices yet"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtersActive
                  ? "Try adjusting your search or filters."
                  : "Invoices will appear here once milestones are invoiced."}
              </p>
            </div>
            {filtersActive && (
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
