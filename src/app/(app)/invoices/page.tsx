import Link from "next/link";
import { FileText, DollarSign, CheckCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      milestone: {
        include: { project: true },
      },
    },
  });

  const totalAmount = invoices.reduce(
    (sum, inv) => sum + Number(inv.totalPayable),
    0,
  );
  const paidAmount = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.totalPayable), 0);
  const pendingAmount = invoices
    .filter((inv) =>
      ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(inv.status),
    )
    .reduce((sum, inv) => sum + Number(inv.totalPayable), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} total`}
        breadcrumbs={[]}
      />

      {/* Summary Cards */}
      {invoices.length > 0 && (
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="accent-indigo card-hover bg-card rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-500/10 p-3">
                <DollarSign
                  className="h-5 w-5 text-indigo-400"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Total Invoiced
                </p>
                <p className="text-foreground mt-1 text-2xl font-bold tracking-tight">
                  $
                  {totalAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="accent-emerald card-hover bg-card rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <CheckCircle
                  className="h-5 w-5 text-emerald-400"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Paid
                </p>
                <p className="text-foreground mt-1 text-2xl font-bold tracking-tight">
                  $
                  {paidAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="accent-amber card-hover bg-card rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-amber-500/10 p-3">
                <Clock className="h-5 w-5 text-amber-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Pending
                </p>
                <p className="text-foreground mt-1 text-2xl font-bold tracking-tight">
                  $
                  {pendingAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="border-border/50 bg-accent/50 grid grid-cols-[120px_1fr_150px_100px_80px_110px_110px_110px] gap-0 border-b px-6 py-3.5">
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Invoice #
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Project
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Milestone
          </span>
          <span className="text-muted-foreground text-right text-[11px] font-bold tracking-wider uppercase">
            Amount
          </span>
          <span className="text-muted-foreground text-right text-[11px] font-bold tracking-wider uppercase">
            VAT
          </span>
          <span className="text-muted-foreground text-right text-[11px] font-bold tracking-wider uppercase">
            Total
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Status
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Due Date
          </span>
        </div>

        <div className="divide-border/30 divide-y">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/projects/${invoice.milestone.projectId}`}
              className="table-row-hover grid grid-cols-[120px_1fr_150px_100px_80px_110px_110px_110px] items-center gap-0 px-6 py-4"
            >
              <span className="font-mono text-xs font-bold text-indigo-400">
                {invoice.invoiceNumber}
              </span>
              <span className="text-foreground truncate text-sm">
                {invoice.milestone.project.name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {invoice.milestone.name}
              </span>
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
            </Link>
          ))}
        </div>

        {invoices.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="rounded-2xl bg-indigo-500/10 p-4">
              <FileText className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                No invoices yet
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Invoices will appear here once milestones are invoiced.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
