import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  Calendar,
  Monitor,
  Mail,
  Hash,
  Building2,
  Target,
  Receipt,
  Download,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { MilestoneForm } from "@/components/common/milestone-form";
import { ProjectSheet } from "@/components/common/project-sheet";
import { serializeForClient } from "@/lib/serialize";
import { InvoiceSheet } from "@/components/common/invoice-sheet";
import { sumUniqueInvoices, deduplicateInvoices } from "@/lib/financial";
import { NotesSection } from "@/components/common/notes-section";
import { FloatingActions } from "@/components/projects/floating-actions";
import { getInitials, safePercent, formatCurrency, formatDate } from "@/lib/format";
import { ContactsSection } from "@/components/common/contacts-section";
import { DeliveryNoteSheet } from "@/components/common/delivery-note-sheet";
import { AddDeliveryNoteSheet } from "@/components/common/add-delivery-note-sheet";
import { MilestoneStatusAction } from "@/components/common/milestone-status-action";
import { InvoiceDetailSheet } from "@/components/common/invoice-detail-sheet";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, projectManagers, clients, notes, contacts] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: true,
        milestones: {
          orderBy: { plannedDate: "asc" },
          include: { deliveryNote: true, invoice: { include: { payments: true } } },
        },
        deliveryNotes: {
          orderBy: { createdAt: "desc" },
          include: { milestone: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.projectManager.findMany({
      select: { id: true, name: true, title: true, photoUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.note.findMany({
      where: { entityType: "PROJECT", entityId: id },
      orderBy: { createdAt: "desc" },
      include: { attachments: true },
    }),
    prisma.contact.findMany({
      where: { entityType: "Project", entityId: id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!project) notFound();

  // Billed = sum of unique invoices (deduplicated to prevent double-counting shared invoices)
  const billedAmount = sumUniqueInvoices(project.milestones);

  // Collected = only PAID invoices (deduplicated)
  const collectedAmount = sumUniqueInvoices(project.milestones, "PAID");

  const alerts: { type: "warning" | "info"; message: string }[] = [];
  if (project.milestones.length === 0 && project.status === "ACTIVE") {
    alerts.push({ type: "warning", message: "No milestones defined yet." });
  }
  if (project.milestones.filter((m) => m.requiresDeliveryNote && !m.deliveryNote && m.status === "COMPLETED").length > 0) {
    alerts.push({ type: "warning", message: "Completed milestone(s) missing delivery note." });
  }
  if (project.milestones.filter((m) => m.status === "COMPLETED" && !m.invoice).length > 0) {
    alerts.push({ type: "info", message: "Completed milestone(s) ready for invoicing." });
  }

  const contractValue = Number(project.contractValue);
  const contractValueFormatted = formatCurrency(contractValue, project.currency);

  const billedPercent = safePercent(billedAmount, contractValue);
  const collectedPercent = safePercent(collectedAmount, contractValue);

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const pmInitials = getInitials(project.projectManager.name);

  const isOverbilled = billedAmount > contractValue;

  if (isOverbilled) {
    const overAmount = formatCurrency(billedAmount - contractValue, project.currency);
    alerts.push({ type: "warning", message: `Billed amount exceeds contract by ${overAmount}.` });
  }

  // Deduplicate invoices from milestones
  const invoices = deduplicateInvoices(project.milestones);

  const invoiceTotalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const invoiceTotalVat = invoices.reduce((sum, inv) => sum + Number(inv.vatAmount), 0);
  const invoiceTotalPayable = invoices.reduce((sum, inv) => sum + Number(inv.totalPayable), 0);

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/25 bg-card p-6 pb-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent blur-3xl" />

        <div className="relative space-y-3">
          {/* Row 1: Name + badges + edit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                <span className="text-sm font-bold text-primary">{getInitials(project.name)}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <StatusBadge status={project.status} size="lg" />
            </div>
            <ProjectSheet project={{ ...serializeForClient(project), contacts: contacts.map((c) => ({ name: c.name, type: c.type, value: c.value })) }} projectManagers={projectManagers} clients={clients} />
          </div>

          {/* Row 2: All details */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href={`/clients/${project.clientId}`} className="flex items-center gap-1.5 transition-colors hover:text-secondary-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{project.client.name}</span>
            </Link>
            <div className="h-4 w-px bg-border/20" />
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {project.contractNumber}
            </div>
            <div className="h-4 w-px bg-border/20" />
            <Link
              href={`/project-managers/${project.projectManager.id}`}
              className="flex items-center gap-2 transition-colors hover:text-secondary-foreground"
            >
              {project.projectManager.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.projectManager.photoUrl} alt={project.projectManager.name} className="h-5 w-5 rounded-full object-cover ring-1 ring-ring/20" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-ring/20">
                  {pmInitials}
                </div>
              )}
              <span className="font-semibold text-foreground">{project.projectManager.name}</span>
            </Link>
            <div className="h-4 w-px bg-border/20" />
            {project.type === "PRODUCT" ? (
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">Product</span>
            ) : (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">Project</span>
            )}
            <div className="h-4 w-px bg-border/20" />
            <div className="flex items-center gap-1.5">
              {project.clientInvoicingMethod === "PORTAL" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
              <span className="font-semibold text-foreground">{project.clientInvoicingMethod === "PORTAL" ? "Portal" : "Email"}</span>
            </div>
            <div className="h-4 w-px bg-border/20" />
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{formatDate(startDate, "full")}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{formatDate(endDate, "full")}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                alert.type === "warning"
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                  : "bg-accent text-muted-foreground ring-1 ring-ring/20"
              }`}>
                {alert.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Contacts */}
        <div className="mt-4 border-t border-border/15 pt-4">
          <ContactsSection entityType="Project" entityId={project.id} contacts={contacts} bare />
        </div>

      </div>

      {/* ── Billing overview ── */}
      <div className="rounded-xl border border-border bg-card card-elevated p-6">
        <div className="flex items-start gap-8">
          {/* Contract value */}
          <div className="shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">{contractValueFormatted}</p>
            <p className="text-sm text-muted-foreground">{project.currency} · {project.paymentTerms}</p>
          </div>

          {/* Separator */}
          <div className="self-stretch w-px bg-gradient-to-b from-transparent via-border to-transparent" />

          {/* Billed */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billed</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(billedAmount, project.currency)} <span className="text-muted-foreground font-normal text-sm">/ {contractValueFormatted}</span></span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all ${isOverbilled ? "bg-red-500/60" : "bg-amber-400"}`} style={{ width: `${billedPercent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className={`font-medium ${isOverbilled ? "text-red-500" : "text-muted-foreground"}`}>{billedPercent}%</span>
              {isOverbilled ? (
                <span className="font-medium text-red-400">{(billedAmount - contractValue).toLocaleString()} over-billed</span>
              ) : (
                <span className="text-muted-foreground">{(contractValue - billedAmount).toLocaleString()} remaining</span>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="self-stretch w-px bg-gradient-to-b from-transparent via-border to-transparent" />

          {/* Collected */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collected</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(collectedAmount, project.currency)} <span className="text-muted-foreground font-normal text-sm">/ {formatCurrency(billedAmount, project.currency)}</span></span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="relative h-full" style={{ width: `${billedPercent}%` }}>
                <div className="absolute inset-0 rounded-full bg-amber-200" />
                <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/50 transition-all" style={{ width: billedAmount > 0 ? `${Math.round((collectedAmount / billedAmount) * 100)}%` : "0%" }} />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">{collectedPercent}%</span>
              <span className="text-muted-foreground">{(billedAmount - collectedAmount).toLocaleString()} outstanding</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Milestones table ── */}
      <div id="milestones-section" className="overflow-hidden rounded-xl border border-border/25 bg-card card-elevated scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-muted p-2">
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Milestones</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
              {project.milestones.length}
            </span>
          </div>
        </div>

        {project.milestones.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Note</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`group transition-colors hover:bg-accent ${
                    idx < project.milestones.length - 1 ? "border-b border-border/10" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <Link href={`/milestones/${m.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(Number(m.value), project.currency)}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(m.plannedDate, "short")}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-4">
                    {m.requiresDeliveryNote ? (
                      m.deliveryNote ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={m.deliveryNote.status} />
                          <DeliveryNoteSheet
                            projectId={project.id}
                            milestoneId={m.id}
                            milestoneName={m.name}
                            deliveryNote={{
                              id: m.deliveryNote.id,
                              description: m.deliveryNote.description,
                              workDelivered: m.deliveryNote.workDelivered,
                              status: m.deliveryNote.status,
                              sentDate: m.deliveryNote.sentDate,
                              signedDate: m.deliveryNote.signedDate,
                              signedDocumentUrl: m.deliveryNote.signedDocumentUrl,
                            }}
                            variant="view"
                          />
                        </div>
                      ) : (
                        <DeliveryNoteSheet
                          projectId={project.id}
                          milestoneId={m.id}
                          milestoneName={m.name}
                          variant="create"
                        />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {m.invoice ? (
                      <StatusBadge status={m.invoice.status} />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <MilestoneStatusAction
                      milestoneId={m.id}
                      currentStatus={m.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-accent p-3">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No milestones defined yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first milestone below</p>
          </div>
        )}

        <MilestoneForm projectId={project.id} />
      </div>

      {/* ── Delivery Notes ── */}
      <div className="overflow-hidden rounded-xl border border-border/25 bg-card card-elevated">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-muted p-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Delivery Notes</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
              {project.deliveryNotes.length}
            </span>
          </div>
          <AddDeliveryNoteSheet
            projectId={project.id}
            milestones={project.milestones.map((m) => ({
              id: m.id,
              name: m.name,
              status: m.status,
              hasDeliveryNote: !!m.deliveryNote,
              requiresDeliveryNote: m.requiresDeliveryNote,
            }))}
          />
        </div>

        {project.deliveryNotes.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Milestone</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sent</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signed</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.deliveryNotes.map((dn, idx) => (
                <tr key={dn.id} className={`transition-colors hover:bg-accent ${idx < project.deliveryNotes.length - 1 ? "border-b border-border/10" : ""}`}>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{dn.milestone?.name ?? "—"}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground max-w-[200px] truncate">{dn.description}</td>
                  <td className="px-4 py-4"><StatusBadge status={dn.status} /></td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{dn.sentDate ? formatDate(dn.sentDate, "short") : "—"}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{dn.signedDate ? formatDate(dn.signedDate, "short") : "—"}</td>
                  <td className="px-4 py-4 text-center">
                    <DeliveryNoteSheet
                      projectId={project.id}
                      milestoneId={dn.milestoneId ?? ""}
                      milestoneName={dn.milestone?.name ?? "No milestone"}
                      deliveryNote={{
                        id: dn.id,
                        description: dn.description,
                        workDelivered: dn.workDelivered,
                        status: dn.status,
                        sentDate: dn.sentDate,
                        signedDate: dn.signedDate,
                        signedDocumentUrl: dn.signedDocumentUrl,
                      }}
                      variant="view"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-accent p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No delivery notes yet</p>
          </div>
        )}
      </div>

      {/* ── Invoices table ── */}
      <div id="invoices-section" className="overflow-hidden rounded-xl border border-border/25 bg-card card-elevated scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-muted p-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Invoices</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
              {invoices.length}
            </span>
          </div>
          <InvoiceSheet
            milestones={project.milestones.map((m) => ({
              id: m.id,
              name: m.name,
              value: m.value.toString(),
              status: m.status,
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
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice #</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Milestones</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">VAT</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Payable</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => {
                  const isOverdue = inv.paymentDueDate && new Date(inv.paymentDueDate) < now && inv.status !== "PAID";
                  return (
                    <tr
                      key={inv.id}
                      className={`group transition-colors hover:bg-accent ${
                        idx < invoices.length - 1 ? "border-b border-border/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <InvoiceDetailSheet
                          invoice={{
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber,
                            amount: inv.amount,
                            vatAmount: inv.vatAmount,
                            totalPayable: inv.totalPayable,
                            status: inv.status,
                            paymentDueDate: inv.paymentDueDate,
                            submittedDate: inv.submittedDate,
                            milestoneNames: inv.milestoneNames,
                            payments: inv.payments.map((p) => ({
                              id: p.id,
                              amount: Number(p.amount),
                              receivedDate: p.receivedDate.toISOString(),
                              reference: p.reference,
                            })),
                          }}
                          currency={project.currency}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground" title={inv.milestoneNames.join(", ")}>
                        {inv.milestoneNames[0]}
                        {inv.milestoneNames.length > 1 && (
                          <span className="ml-1 text-muted-foreground">+{inv.milestoneNames.length - 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(Number(inv.amount), project.currency)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(Number(inv.vatAmount), project.currency)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(Number(inv.totalPayable), project.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {inv.paymentDueDate ? (
                          <span className={isOverdue ? "font-medium text-red-400" : "text-muted-foreground"}>
                            {formatDate(inv.paymentDueDate, "full")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
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
                <tr className="border-t border-border bg-accent">
                  <td className="px-6 py-3.5 text-sm font-bold text-foreground" colSpan={2}>Total</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(invoiceTotalAmount, project.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-muted-foreground">
                    {formatCurrency(invoiceTotalVat, project.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(invoiceTotalPayable, project.currency)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full bg-accent p-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Invoices will appear here once milestones are invoiced</p>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <div id="notes-section" className="scroll-mt-6">
        <NotesSection entityType="PROJECT" entityId={project.id} notes={serializeForClient(notes)} />
      </div>

      {/* Bottom spacer for floating bar */}
      <div className="h-16" />

      {/* Floating Action Bar */}
      <FloatingActions
        project={serializeForClient(project)}
        notesCount={notes.length}
      />
    </div>
  );
}
