import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Target,
  Briefcase,
  FileCheck,
  Wallet,
  Receipt,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { serializeForClient } from "@/lib/serialize";
import { BillingRingChart } from "@/components/common/pm-charts";
import { sumUniqueInvoices, deduplicateInvoices } from "@/lib/financial";
import { PMFloatingActions } from "@/components/project-managers/floating-actions";
import { PMSheet } from "@/components/common/pm-sheet";
import { NotesSection } from "@/components/common/notes-section";
import { ContactDetailRow } from "@/components/clients/contact-detail-row";
import { filterOverdue, filterUpcoming, countCompleted, completionPercent, daysDifference } from "@/lib/milestones";
import { getInitials, safePercent, formatCurrency, formatDate, formatMultiCurrency, addToCurrency, sumCurrencyTotals, type CurrencyTotals } from "@/lib/format";

export default async function ProjectManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pm, notes] = await Promise.all([
    prisma.projectManager.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { updatedAt: "desc" },
          include: {
            client: { select: { name: true } },
            milestones: {
              orderBy: { plannedDate: "asc" },
              include: {
                deliveryNote: true,
                invoice: { include: { payments: true } },
              },
            },
          },
        },
      },
    }),
    prisma.note.findMany({
      where: { entityType: "PROJECT_MANAGER", entityId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!pm) notFound();

  const initials = getInitials(pm.name);

  const totalProjects = pm.projects.length;
  const activeProjects = pm.projects.filter((p) => p.status === "ACTIVE").length;
  const allMilestones = pm.projects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = countCompleted(allMilestones);
  const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
  const now = new Date();
  const overdueMilestones = filterOverdue(allMilestones, now);
  const completionRate = completionPercent(allMilestones);

  const portfolioByCurrency: CurrencyTotals = {};
  const billedByCurrency: CurrencyTotals = {};
  const collectedByCurrency: CurrencyTotals = {};
  for (const p of pm.projects) {
    addToCurrency(portfolioByCurrency, p.currency, Number(p.contractValue));
    const projBilled = sumUniqueInvoices(p.milestones);
    const projCollected = sumUniqueInvoices(p.milestones, "PAID");
    addToCurrency(billedByCurrency, p.currency, projBilled);
    addToCurrency(collectedByCurrency, p.currency, projCollected);
  }
  const totalContractValue = sumCurrencyTotals(portfolioByCurrency);
  const totalInvoiced = sumCurrencyTotals(billedByCurrency);
  const totalPaid = sumCurrencyTotals(collectedByCurrency);
  const billingPercent = safePercent(totalInvoiced, totalContractValue);
  const collectionPercent = safePercent(totalPaid, totalInvoiced);

  const upcomingMilestones = filterUpcoming(allMilestones, 30, now)
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  // Find project name for a milestone
  const milestoneProjectMap = new Map<string, { projectName: string; projectId: string }>();
  for (const project of pm.projects) {
    for (const m of project.milestones) {
      milestoneProjectMap.set(m.id, { projectName: project.name, projectId: project.id });
    }
  }

  // Deduplicate invoices from all milestones across projects
  const invoices = deduplicateInvoices(
    pm.projects.flatMap((p) => p.milestones.map((m) => ({ ...m, _project: p }))),
    (m) => m._project.name,
  );

  const invoiceTotalPayable = invoices.reduce((sum, inv) => sum + Number(inv.totalPayable), 0);

  return (
    <div className="space-y-6">
      {/* ── A. Header ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-accent">
        <div className="relative px-6 py-5">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />

          {/* Top: Avatar + Name + Badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {pm.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pm.photoUrl}
                  alt={pm.name}
                  className="h-14 w-14 rounded-xl object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-base font-bold text-foreground ring-2 ring-primary/20">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{pm.name}</h1>
                  {pm.title && (
                    <span className="rounded-md bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {pm.title}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Joined {new Date(pm.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
            <PMSheet pm={serializeForClient(pm)} variant="edit" />
          </div>

          {/* Contact details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 rounded-xl bg-accent px-4 py-3.5">
            {pm.email && (
              <ContactDetailRow value={pm.email} icon="mail" href={`mailto:${pm.email}`} />
            )}
            {pm.phone && (
              <ContactDetailRow value={pm.phone} icon="phone" href={`tel:${pm.phone}`} />
            )}
          </div>
        </div>
      </div>

      {/* ── B. Financial & Delivery Dashboard ── */}
      {totalProjects > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-accent">

          {/* Top row: Financial metrics + Chart */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] divide-x divide-border/50">
            {/* Portfolio */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-primary/[0.04] blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portfolio</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{formatMultiCurrency(portfolioByCurrency)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm tabular-nums text-muted-foreground">{totalProjects} projects</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="text-sm font-medium text-emerald-500">{activeProjects} active</span>
              </div>
            </div>

            {/* Billed */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-500/[0.04] blur-3xl" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billed</span>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-600">{billingPercent}%</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{formatMultiCurrency(billedByCurrency)}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500/50 to-amber-400" style={{ width: `${billingPercent}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground"><span className="tabular-nums text-amber-400/50">{(totalContractValue - totalInvoiced).toLocaleString()}</span> unbilled</p>
            </div>

            {/* Collected */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/[0.04] blur-3xl" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collected</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-600">{collectionPercent}%</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{formatMultiCurrency(collectedByCurrency)}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400" style={{ width: `${collectionPercent}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground"><span className="tabular-nums text-emerald-400/50">{(totalInvoiced - totalPaid).toLocaleString()}</span> outstanding</p>
            </div>

            {/* Ring Chart */}
            <div className="flex flex-col items-center justify-center px-6 py-3">
              <BillingRingChart billed={totalInvoiced} collected={totalPaid} total={totalContractValue} />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-accent" />

          {/* Bottom row: Delivery + Overdue + Upcoming — 3 equal columns */}
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {/* Delivery summary */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-3.5 w-3.5 text-blue-400/70" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${activeProjects > 0 ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {activeProjects > 0 ? "Active" : "Idle"}
                </span>
              </div>
              <div className="space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-bold tabular-nums text-foreground">{completedMilestones}/{totalMilestones}</span>
                    <span className="text-xs text-muted-foreground">done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400/60" />
                    <span className="text-sm font-bold tabular-nums text-foreground">{inProgressMilestones}</span>
                    <span className="text-xs text-muted-foreground">wip</span>
                  </div>
                  {overdueMilestones.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-sm font-bold tabular-nums text-red-400">{overdueMilestones.length}</span>
                      <span className="text-xs text-red-400/50">late</span>
                    </div>
                  )}
                </div>
                {/* Completion bar */}
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500/50 to-blue-400" style={{ width: `${completionRate}%` }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-500">Overdue</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold tabular-nums text-red-600">{overdueMilestones.length}</span>
              </div>
              {overdueMilestones.length > 0 ? (
                <div className="max-h-[96px] overflow-y-auto space-y-1 pr-0.5">
                  {overdueMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysOverdue = daysDifference(m.plannedDate, now);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 transition-colors hover:bg-red-100">
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-medium text-secondary-foreground truncate">{m.name}</p>
                          {proj && <p className="text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-red-500">{daysOverdue}d</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg bg-accent py-5 text-xs text-emerald-400/50">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  All on track
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70">Upcoming</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">{upcomingMilestones.length}</span>
              </div>
              {upcomingMilestones.length > 0 ? (
                <div className="max-h-[96px] overflow-y-auto space-y-1 pr-0.5">
                  {upcomingMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysUntil = -daysDifference(m.plannedDate, now);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2 transition-colors hover:bg-accent">
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-medium text-secondary-foreground truncate">{m.name}</p>
                          {proj && <p className="text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <span className={`shrink-0 text-xs font-bold tabular-nums ${daysUntil <= 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg bg-accent py-5 text-xs text-muted-foreground">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── C. Projects table ── */}
      <div id="projects-section" className="overflow-hidden rounded-xl border border-border bg-card card-elevated scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/12 p-2">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground">Assigned Projects</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {pm.projects.length}
            </span>
          </div>
        </div>

        {pm.projects.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Project</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Client</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Value</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billed</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Progress</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {pm.projects.map((project, idx) => {
                const done = countCompleted(project.milestones);
                const pct = completionPercent(project.milestones);
                const projBilled = sumUniqueInvoices(project.milestones);
                const projValue = Number(project.contractValue);
                const billedPct = safePercent(projBilled, projValue);

                // Timeline
                const start = new Date(project.startDate);
                const end = new Date(project.endDate);
                const totalDur = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timePct = totalDur > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100))) : 0;

                return (
                  <tr
                    key={project.id}
                    className={`group transition-colors hover:bg-accent ${idx < pm.projects.length - 1 ? "border-b border-border/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/projects/${project.id}`} className="text-base font-semibold text-foreground hover:text-primary/80 transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/70">{project.client.name}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-secondary-foreground whitespace-nowrap">
                      {formatCurrency(projValue, project.currency)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm tabular-nums text-secondary-foreground">{formatCurrency(projBilled, project.currency)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({billedPct}%)</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground/60">{done}/{project.milestones.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full transition-all ${timePct >= 90 ? "bg-red-500/70" : timePct >= 70 ? "bg-amber-500/70" : "bg-blue-500/50"}`} style={{ width: `${timePct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{timePct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No projects assigned yet.
          </div>
        )}
      </div>

      {/* ── D. Invoices Table ── */}
      <div id="invoices-section" className="overflow-hidden rounded-xl border border-border bg-card card-elevated scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-muted p-2">
              <Receipt className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <span className="text-base font-bold text-foreground">Invoices</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {invoices.length}
            </span>
          </div>
        </div>

        {invoices.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/15">
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Invoice #</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Project</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Milestones</th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Amount</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Due Date</th>
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
                        <span className="font-mono text-sm font-semibold text-secondary-foreground">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground/70">
                        {inv.projectName}
                      </td>
                      <td className="px-4 py-4 text-sm text-secondary-foreground" title={inv.milestoneNames.join(", ")}>
                        {inv.milestoneNames[0]}
                        {inv.milestoneNames.length > 1 && (
                          <span className="ml-1 text-muted-foreground/60">+{inv.milestoneNames.length - 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        {Number(inv.totalPayable).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {inv.paymentDueDate ? (
                          <span className={isOverdue ? "font-medium text-red-400" : "text-muted-foreground/70"}>
                            {formatDate(inv.paymentDueDate, "full")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary row */}
              <tfoot>
                <tr className="border-t border-border bg-accent">
                  <td className="px-6 py-3.5 text-sm font-bold text-foreground" colSpan={3}>Total</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    {invoiceTotalPayable.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 rounded-full bg-accent p-3">
              <Receipt className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground/60">No invoices yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Invoices will appear here once milestones are invoiced</p>
          </div>
        )}
      </div>

      {/* ── E. Notes ── */}
      <div id="notes-section" className="scroll-mt-6">
        <NotesSection entityType="PROJECT_MANAGER" entityId={pm.id} notes={serializeForClient(notes)} />
      </div>

      <div className="h-16" />

      <PMFloatingActions notesCount={notes.length} />
    </div>
  );
}
