import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Monitor,
  Mail,
  Hash,
  Building2,
  Target,
  Pause,
  Receipt,
  Download,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { MilestoneForm } from "@/components/common/milestone-form";
import { ProjectSheet } from "@/components/common/project-sheet";
import { ProjectStatusActions } from "@/components/common/project-status-actions";
import { serializeForClient } from "@/lib/serialize";
import { InvoiceSheet } from "@/components/common/invoice-sheet";
import { sumUniqueInvoices } from "@/lib/financial";
import { NotesSection } from "@/components/common/notes-section";

function getLifecycleStep(status: string): number {
  if (status === "CLOSED") return 2;
  if (status === "ON_HOLD") return 1;
  return 0;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, projectManagers, clients, notes] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: true,
        milestones: {
          orderBy: { plannedDate: "asc" },
          include: { deliveryNote: true, invoice: { include: { payments: true } } },
        },
      },
    }),
    prisma.projectManager.findMany({
      select: { id: true, name: true, title: true, photoUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true, imageUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.note.findMany({
      where: { entityType: "PROJECT", entityId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!project) notFound();

  const totalMilestoneValue = project.milestones.reduce((sum, m) => sum + Number(m.value), 0);
  // Billed = sum of unique invoices (deduplicated to prevent double-counting shared invoices)
  const billedAmount = sumUniqueInvoices(project.milestones);

  // Collected = only PAID invoices (deduplicated)
  const collectedAmount = sumUniqueInvoices(project.milestones, "PAID");

  const lifecycleStep = getLifecycleStep(project.status);

  const alerts: { type: "warning" | "info"; message: string }[] = [];
  if (project.milestones.length === 0 && project.status === "ACTIVE") {
    alerts.push({ type: "warning", message: "No milestones defined yet." });
  }
  if (project.milestones.filter((m) => m.requiresDeliveryNote && !m.deliveryNote && m.status === "COMPLETED").length > 0) {
    alerts.push({ type: "warning", message: "Completed milestone(s) missing delivery note." });
  }
  if (project.milestones.filter((m) => m.status === "READY_FOR_INVOICING" && !m.invoice).length > 0) {
    alerts.push({ type: "info", message: "Milestone(s) ready for invoicing." });
  }

  const contractValue = Number(project.contractValue);
  const contractValueFormatted = contractValue.toLocaleString("en-US", {
    style: "currency", currency: project.currency, maximumFractionDigits: 0,
  });

  const stages = [
    { label: "Active", icon: Clock, done: lifecycleStep > 0, current: lifecycleStep === 0 },
    { label: "On Hold", icon: Pause, done: lifecycleStep > 1, current: lifecycleStep === 1 },
    { label: "Closed", icon: CheckCircle2, done: false, current: lifecycleStep === 2 },
  ];

  const billedPercent = contractValue > 0 ? Math.min(100, Math.round((billedAmount / contractValue) * 100)) : 0;
  const collectedPercent = contractValue > 0 ? Math.min(100, Math.round((collectedAmount / contractValue) * 100)) : 0;

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const pmInitials = project.projectManager.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currencySymbol = contractValueFormatted.replace(/[\d,.\s]/g, "").trim();
  const isOverbilled = billedAmount > contractValue;
  function formatAmount(amount: number) {
    return amount.toLocaleString();
  }

  const projectCurrency = project.currency;
  function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
      style: "currency", currency: projectCurrency, maximumFractionDigits: 0,
    });
  }

  if (isOverbilled) {
    const overAmount = (billedAmount - contractValue).toLocaleString("en-US", {
      style: "currency", currency: project!.currency, maximumFractionDigits: 0,
    });
    alerts.push({ type: "warning", message: `Billed amount exceeds contract by ${overAmount}.` });
  }

  // Deduplicate invoices from milestones
  const invoiceMap = new Map<string, {
    id: string;
    invoiceNumber: string;
    amount: unknown;
    vatAmount: unknown;
    totalPayable: unknown;
    status: string;
    paymentDueDate: Date | null;
    createdAt: Date;
    milestoneNames: string[];
  }>();
  project.milestones.forEach((m) => {
    if (m.invoice && !invoiceMap.has(m.invoice.id)) {
      invoiceMap.set(m.invoice.id, {
        ...m.invoice,
        milestoneNames: [],
      });
    }
    if (m.invoice) {
      invoiceMap.get(m.invoice.id)!.milestoneNames.push(m.name);
    }
  });
  const invoices = Array.from(invoiceMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const invoiceTotalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const invoiceTotalVat = invoices.reduce((sum, inv) => sum + Number(inv.vatAmount), 0);
  const invoiceTotalPayable = invoices.reduce((sum, inv) => sum + Number(inv.totalPayable), 0);

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/25 bg-card p-6 pb-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {(project.imageUrl || project.client.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(project.imageUrl ?? project.client.imageUrl)!}
                  alt={project.name}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]">
                  <span className="text-lg font-bold text-foreground/70">
                    {project.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 text-base">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-muted-foreground/50">Client:</span>
                <span className="font-semibold text-foreground/85">{project.client.name}</span>
              </div>
              <div className="h-4 w-px bg-border/20" />
              <div className="flex items-center gap-1.5 font-mono text-muted-foreground/60">
                <Hash className="h-3.5 w-3.5" />
                {project.contractNumber}
              </div>
              <div className="h-4 w-px bg-border/20" />
              <Link
                href={`/project-managers/${project.projectManager.id}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground/70"
              >
                <span className="text-muted-foreground/50">PM:</span>
                {project.projectManager.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.projectManager.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-bold text-foreground/60 ring-1 ring-white/[0.08]">
                    {pmInitials}
                  </div>
                )}
                <span className="font-semibold text-foreground/85">{project.projectManager.name}</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ProjectStatusActions projectId={project.id} currentStatus={project.status} />
            <ProjectSheet
              project={serializeForClient(project)}
              projectManagers={projectManagers}
              clients={clients}
            />
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                alert.type === "warning"
                  ? "bg-amber-500/10 text-amber-400/80 ring-1 ring-amber-500/10"
                  : "bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06]"
              }`}>
                {alert.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Lifecycle + Details */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/15 pt-4">
          {/* Lifecycle steps */}
          <div className="flex items-center gap-1 mr-1">
            {stages.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    s.done
                      ? "bg-muted-foreground/15"
                      : s.current
                        ? "bg-foreground/10 ring-1 ring-foreground/15"
                        : "bg-white/[0.04]"
                  }`}>
                    {s.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                    ) : (
                      <s.icon className={`h-3.5 w-3.5 ${s.current ? "text-foreground/70" : "text-muted-foreground/25"}`} />
                    )}
                  </div>
                  <span className={`text-base font-semibold whitespace-nowrap ${
                    s.done ? "text-muted-foreground/50" : s.current ? "text-foreground" : "text-muted-foreground/30"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`mx-1.5 h-px w-5 ${s.done ? "bg-muted-foreground/20" : "bg-border/20"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="h-4 w-px bg-border/20" />

          <div className="flex items-center gap-2 text-base">
            <span className="text-muted-foreground/50">{project.clientInvoicingMethod === "PORTAL" ? <Monitor className="h-4 w-4" /> : <Mail className="h-4 w-4" />}</span>
            <span className="text-muted-foreground/70">Invoicing:</span>
            <span className="font-semibold text-foreground/85">{project.clientInvoicingMethod === "PORTAL" ? "Portal" : "Email"}</span>
          </div>
          <div className="h-4 w-px bg-border/20" />
          <div className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground/50" />
            <span className="font-semibold text-foreground/85">{startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="text-muted-foreground/40">→</span>
            <span className="font-semibold text-foreground/85">{endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* ── Billing overview ── */}
      <div className="rounded-xl border border-border/20 bg-card/40 p-6">
        <div className="flex items-start gap-8">
          {/* Contract value */}
          <div className="shrink-0">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Contract</p>
            <p className="mt-0.5 text-4xl font-bold tracking-tight text-foreground">{contractValueFormatted}</p>
            <p className="text-sm text-muted-foreground/50">{project.currency} · {project.paymentTerms}</p>
          </div>

          {/* Billed */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Billed</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(billedAmount)} <span className="text-muted-foreground/40 font-normal text-sm">/ {contractValueFormatted}</span></span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className={`h-full rounded-full transition-all ${isOverbilled ? "bg-red-500/60" : "bg-foreground/25"}`} style={{ width: `${billedPercent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className={`font-medium ${isOverbilled ? "text-red-400/70" : "text-muted-foreground/60"}`}>{billedPercent}%</span>
              {isOverbilled ? (
                <span className="font-medium text-red-400">{formatAmount(billedAmount - contractValue)} over-billed</span>
              ) : (
                <span className="text-muted-foreground/50">{formatAmount(contractValue - billedAmount)} remaining</span>
              )}
            </div>
          </div>

          {/* Collected */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Collected</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(collectedAmount)} <span className="text-muted-foreground/40 font-normal text-sm">/ {formatCurrency(billedAmount)}</span></span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="relative h-full" style={{ width: `${billedPercent}%` }}>
                <div className="absolute inset-0 rounded-full bg-foreground/10" />
                <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/50 transition-all" style={{ width: billedAmount > 0 ? `${Math.round((collectedAmount / billedAmount) * 100)}%` : "0%" }} />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="font-medium text-muted-foreground/60">{collectedPercent}%</span>
              <span className="text-muted-foreground/50">{(billedAmount - collectedAmount).toLocaleString()} outstanding</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Milestones table ── */}
      <div className="overflow-hidden rounded-xl border border-border/25 bg-card/50">
        <div className="flex items-center justify-between border-b border-border/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.06] p-2">
              <Target className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <span className="text-lg font-bold text-foreground">Milestones</span>
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {project.milestones.length}
            </span>
          </div>
        </div>

        {project.milestones.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Name</th>
                <th className="px-4 py-3.5 text-right text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Value</th>
                <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Date</th>
                <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
                <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Delivery Note</th>
                <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`group transition-colors hover:bg-white/[0.03] ${
                    idx < project.milestones.length - 1 ? "border-b border-border/10" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <Link href={`/milestones/${m.id}`} className="text-base font-semibold text-foreground hover:text-foreground/70 transition-colors">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-base font-semibold tabular-nums text-foreground/85">
                    ${Number(m.value).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-4 text-base text-muted-foreground/70">
                    {new Date(m.plannedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-4">
                    {m.requiresDeliveryNote ? (
                      m.deliveryNote ? (
                        <StatusBadge status={m.deliveryNote.status} />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400/80 ring-1 ring-rose-500/15">
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {m.invoice ? (
                      <StatusBadge status={m.invoice.status} />
                    ) : (
                      <span className="text-sm text-muted-foreground/20">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-white/[0.04] p-3">
              <Target className="h-5 w-5 text-muted-foreground/25" />
            </div>
            <p className="text-base text-muted-foreground/60">No milestones defined yet</p>
            <p className="mt-1 text-sm text-muted-foreground/40">Add your first milestone below</p>
          </div>
        )}

        {project.status === "ACTIVE" && (
          <MilestoneForm projectId={project.id} />
        )}
      </div>

      {/* ── Invoices table ── */}
      <div className="overflow-hidden rounded-xl border border-border/25 bg-card/50">
        <div className="flex items-center justify-between border-b border-border/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.06] p-2">
              <Receipt className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <span className="text-lg font-bold text-foreground">Invoices</span>
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {invoices.length}
            </span>
          </div>
          <InvoiceSheet
            milestones={project.milestones.map((m) => ({
              id: m.id,
              name: m.name,
              value: m.value.toString(),
              invoiced: !!m.invoiceId,
            }))}
            currency={project.currency}
          />
        </div>

        {invoices.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/15">
                  <th className="px-6 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Invoice #</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Milestones</th>
                  <th className="px-4 py-3.5 text-right text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Amount</th>
                  <th className="px-4 py-3.5 text-right text-sm font-bold uppercase tracking-wider text-muted-foreground/70">VAT</th>
                  <th className="px-4 py-3.5 text-right text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Total Payable</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
                  <th className="px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Due Date</th>
                  <th className="px-4 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground/70">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => {
                  const isOverdue = inv.paymentDueDate && new Date(inv.paymentDueDate) < now && inv.status !== "PAID";
                  return (
                    <tr
                      key={inv.id}
                      className={`group transition-colors hover:bg-white/[0.03] ${
                        idx < invoices.length - 1 ? "border-b border-border/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-foreground/80">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground/80" title={inv.milestoneNames.join(", ")}>
                        {inv.milestoneNames[0]}
                        {inv.milestoneNames.length > 1 && (
                          <span className="ml-1 text-muted-foreground/60">+{inv.milestoneNames.length - 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground/85">
                        {formatCurrency(Number(inv.amount))}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm tabular-nums text-muted-foreground/60">
                        {formatCurrency(Number(inv.vatAmount))}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(Number(inv.totalPayable))}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {inv.paymentDueDate ? (
                          <span className={isOverdue ? "font-medium text-red-400" : "text-muted-foreground/70"}>
                            {new Date(inv.paymentDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/20">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-white/[0.06] hover:text-foreground/70"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary row */}
              <tfoot>
                <tr className="border-t border-border/20 bg-white/[0.02]">
                  <td className="px-6 py-3.5 text-sm font-bold text-foreground" colSpan={2}>Total</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(invoiceTotalAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-muted-foreground/60">
                    {formatCurrency(invoiceTotalVat)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(invoiceTotalPayable)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-white/[0.04] p-3">
              <Receipt className="h-5 w-5 text-muted-foreground/25" />
            </div>
            <p className="text-base text-muted-foreground/60">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground/40">Invoices will appear here once milestones are invoiced</p>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <NotesSection entityType="PROJECT" entityId={project.id} notes={serializeForClient(notes)} />
    </div>
  );
}
