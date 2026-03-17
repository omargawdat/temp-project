import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  DollarSign,
  Hash,
  Building2,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";

export default async function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, clientName: true, currency: true } },
      deliveryNote: true,
      invoice: { include: { payments: true } },
    },
  });

  if (!milestone) notFound();

  const value = Number(milestone.value);
  const valueFormatted = value.toLocaleString("en-US", {
    style: "currency",
    currency: milestone.project.currency,
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/projects/${milestone.project.id}`} className="hover:text-foreground transition-colors">
            {milestone.project.name}
          </Link>
          <span className="text-border/40">/</span>
          <span className="text-foreground">{milestone.name}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{milestone.name}</h1>
          <StatusBadge status={milestone.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {milestone.project.clientName} · {valueFormatted}
        </p>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Overview */}
        <div className="rounded-xl border border-border/25 bg-card/60 p-5">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Details</p>
          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground/70"><DollarSign className="h-3.5 w-3.5" /> Value</span>
              <span className="font-mono font-medium text-foreground">{valueFormatted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground/70"><Calendar className="h-3.5 w-3.5" /> Planned Date</span>
              <span className="font-medium text-foreground">{new Date(milestone.plannedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground/70"><Clock className="h-3.5 w-3.5" /> Status</span>
              <StatusBadge status={milestone.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground/70"><FileText className="h-3.5 w-3.5" /> Delivery Note</span>
              <span className="font-medium text-foreground">{milestone.requiresDeliveryNote ? "Required" : "Not required"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground/70"><Building2 className="h-3.5 w-3.5" /> Project</span>
              <Link href={`/projects/${milestone.project.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                {milestone.project.name}
              </Link>
            </div>
          </div>
        </div>

        {/* Delivery Note + Invoice */}
        <div className="space-y-5">
          {/* Delivery Note */}
          <div className="rounded-xl border border-border/25 bg-card/60 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Delivery Note</p>
            {milestone.deliveryNote ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Status</span>
                  <StatusBadge status={milestone.deliveryNote.status} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1.5">Description</p>
                  <p className="text-sm text-foreground/80">{milestone.deliveryNote.description}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1.5">Work Delivered</p>
                  <p className="text-sm text-foreground/80">{milestone.deliveryNote.workDelivered}</p>
                </div>
                {milestone.deliveryNote.sentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">Sent</span>
                    <span className="text-xs text-foreground/70">{new Date(milestone.deliveryNote.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}
                {milestone.deliveryNote.signedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/70">Signed</span>
                    <span className="text-xs text-foreground/70">{new Date(milestone.deliveryNote.signedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/40">
                {milestone.requiresDeliveryNote ? "No delivery note created yet." : "Not required for this milestone."}
              </p>
            )}
          </div>

          {/* Invoice */}
          <div className="rounded-xl border border-border/25 bg-card/60 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Invoice</p>
            {milestone.invoice ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Status</span>
                  <StatusBadge status={milestone.invoice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground/70"><Hash className="h-3.5 w-3.5" /> Invoice #</span>
                  <span className="font-mono text-xs font-medium text-foreground">{milestone.invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Amount</span>
                  <span className="font-mono text-xs text-foreground">{Number(milestone.invoice.amount).toLocaleString("en-US", { style: "currency", currency: milestone.project.currency, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">VAT</span>
                  <span className="font-mono text-xs text-foreground">{Number(milestone.invoice.vatAmount).toLocaleString("en-US", { style: "currency", currency: milestone.project.currency, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Total Payable</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{Number(milestone.invoice.totalPayable).toLocaleString("en-US", { style: "currency", currency: milestone.project.currency, maximumFractionDigits: 0 })}</span>
                </div>
                {milestone.invoice.payments.length > 0 && (
                  <>
                    <div className="h-px bg-border/15 my-1" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Payments ({milestone.invoice.payments.length})</p>
                    {milestone.invoice.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground/70">{p.reference}</span>
                        <span className="font-mono text-xs text-foreground">{Number(p.amount).toLocaleString("en-US", { style: "currency", currency: milestone.project.currency, maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/40">No invoice created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
