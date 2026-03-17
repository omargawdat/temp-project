import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  Hash,
  MapPin,
  Globe,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Receipt,
  Target,
  FileText,
  Briefcase,
  FileCheck,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { BillingRingChart } from "@/components/common/pm-charts";
import { ClientSheet } from "@/components/common/client-sheet";
import { sumUniqueInvoices, deduplicateInvoices } from "@/lib/financial";
import { filterOverdue, filterUpcoming, countCompleted, completionPercent, daysDifference } from "@/lib/milestones";
import { getInitials, safePercent, formatDate } from "@/lib/format";
import { serializeForClient } from "@/lib/serialize";
import { NotesSection } from "@/components/common/notes-section";
import { ClientFloatingActions } from "@/components/clients/floating-actions";
import { ContactDetailRow } from "@/components/clients/contact-detail-row";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client, countries, notes] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        country: true,
        projects: {
          orderBy: { updatedAt: "desc" },
          include: {
            projectManager: { select: { id: true, name: true, photoUrl: true } },
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
    prisma.country.findMany({
      select: { id: true, name: true, code: true, flag: true },
      orderBy: { name: "asc" },
    }),
    prisma.note.findMany({
      where: { entityType: "CLIENT", entityId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!client) notFound();

  const initials = getInitials(client.name);

  // ── Key computations ──
  const totalProjects = client.projects.length;
  const activeProjects = client.projects.filter((p) => p.status === "ACTIVE").length;
  const allMilestones = client.projects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = countCompleted(allMilestones);
  const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
  const now = new Date();
  const overdueMilestones = filterOverdue(allMilestones);
  const completionRate = completionPercent(allMilestones);

  const totalContractValue = client.projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
  const totalInvoiced = sumUniqueInvoices(allMilestones);
  const totalPaid = sumUniqueInvoices(allMilestones, "PAID");
  const billingPercent = safePercent(totalInvoiced, totalContractValue);
  const collectionPercent = safePercent(totalPaid, totalInvoiced);

  // Upcoming milestones (next 30 days, not completed)
  const upcomingMilestones = filterUpcoming(allMilestones).sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  // Find project name for a milestone
  const milestoneProjectMap = new Map<string, { projectName: string; projectId: string }>();
  for (const project of client.projects) {
    for (const m of project.milestones) {
      milestoneProjectMap.set(m.id, { projectName: project.name, projectId: project.id });
    }
  }

  // Deduplicate invoices from all milestones
  const invoices = deduplicateInvoices(
    client.projects.flatMap((p) => p.milestones.map((m) => ({ ...m, _project: p }))),
    (m) => m._project.name,
  );

  const invoiceTotalPayable = invoices.reduce((sum, inv) => sum + Number(inv.totalPayable), 0);

  // Sector badge label
  const sectorLabel = client.sector.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* ── A. Header ── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: "linear-gradient(168deg, rgba(14,20,36,0.95) 0%, rgba(10,16,28,0.98) 100%)" }}>
        <div className="relative px-6 py-5">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-orange-500/[0.06] blur-3xl" />

          {/* Top: Avatar + Name + Badge + Code/Country */}
          <div className="flex items-center gap-4 mb-4">
            {client.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.imageUrl}
                alt={client.name}
                className="h-14 w-14 rounded-xl object-cover ring-2 ring-orange-500/20"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-base font-bold text-white ring-2 ring-orange-500/20">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{client.name}</h1>
                <span className="rounded-md bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
                  {sectorLabel}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-white/40">
                <span className="font-mono text-xs tracking-wide text-white/30">{client.code}</span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={client.country.flag} alt={client.country.name} className="h-3 w-5 rounded-[2px] object-cover" />
                <span>{client.country.name}</span>
              </div>
            </div>
          </div>

          {/* Contact details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 rounded-xl bg-white/[0.03] px-4 py-3.5">
            <ContactDetailRow value={client.email} icon="mail" href={`mailto:${client.email}`} />
            {client.phone && (
              <ContactDetailRow value={client.phone} icon="phone" href={`tel:${client.phone}`} />
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="h-4 w-4 text-white/20" />
              <span className="text-white/30">Primary:</span>
              <span className="font-medium text-white/70">{client.primaryContact}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <FileText className="h-4 w-4 text-white/20" />
              <span className="text-white/30">Finance:</span>
              <span className="font-medium text-white/70">{client.financeContact}</span>
            </div>
          </div>

          {/* Portal link */}
          {client.portalName && client.portalLink && (
            <div className="mt-3">
              <a
                href={client.portalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80"
              >
                <Globe className="h-3.5 w-3.5" />
                {client.portalName}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── B. Financial & Delivery Dashboard ── */}
      {totalProjects > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: "linear-gradient(168deg, rgba(14,20,36,0.95) 0%, rgba(10,16,28,0.98) 100%)" }}>

          {/* Top row: Financial metrics + Chart */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] divide-x divide-white/[0.04]">
            {/* Portfolio */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-orange-500/[0.05] blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-3.5 w-3.5 text-orange-400/70" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">Portfolio</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white tabular-nums">${totalContractValue.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm tabular-nums text-white/35">{totalProjects} projects</span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="text-sm font-medium text-emerald-400/70">{activeProjects} active</span>
              </div>
            </div>

            {/* Billed */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-500/[0.04] blur-3xl" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-amber-400/70" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">Billed</span>
                </div>
                <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-400/80">{billingPercent}%</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white tabular-nums">${totalInvoiced.toLocaleString()}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500/50 to-amber-400" style={{ width: `${billingPercent}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-white/25"><span className="tabular-nums text-amber-400/50">${(totalContractValue - totalInvoiced).toLocaleString()}</span> unbilled</p>
            </div>

            {/* Collected */}
            <div className="relative px-5 py-3">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/[0.04] blur-3xl" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400/70" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">Collected</span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-400/80">{collectionPercent}%</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white tabular-nums">${totalPaid.toLocaleString()}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400" style={{ width: `${collectionPercent}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-white/25"><span className="tabular-nums text-emerald-400/50">${(totalInvoiced - totalPaid).toLocaleString()}</span> outstanding</p>
            </div>

            {/* Ring Chart */}
            <div className="flex flex-col items-center justify-center px-6 py-3">
              <BillingRingChart billed={totalInvoiced} collected={totalPaid} total={totalContractValue} />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.04]" />

          {/* Bottom row: Delivery + Overdue + Upcoming — 3 equal columns */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
            {/* Delivery summary */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-3.5 w-3.5 text-blue-400/70" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">Delivery</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${activeProjects > 0 ? "bg-emerald-400/10 text-emerald-400/80" : "bg-white/[0.06] text-white/40"}`}>
                  {activeProjects > 0 ? "Active" : "Idle"}
                </span>
              </div>
              <div className="space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
                    <span className="text-sm font-bold tabular-nums text-white/90">{completedMilestones}/{totalMilestones}</span>
                    <span className="text-xs text-white/30">done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400/60" />
                    <span className="text-sm font-bold tabular-nums text-white/90">{inProgressMilestones}</span>
                    <span className="text-xs text-white/30">wip</span>
                  </div>
                  {overdueMilestones.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400/80" />
                      <span className="text-sm font-bold tabular-nums text-red-400">{overdueMilestones.length}</span>
                      <span className="text-xs text-red-400/50">late</span>
                    </div>
                  )}
                </div>
                {/* Completion bar */}
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500/50 to-blue-400" style={{ width: `${completionRate}%` }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-white/40">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400/80" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-red-400/70">Overdue</span>
                <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-bold tabular-nums text-red-400/80">{overdueMilestones.length}</span>
              </div>
              {overdueMilestones.length > 0 ? (
                <div className="max-h-[96px] overflow-y-auto space-y-1 pr-0.5">
                  {overdueMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysOverdue = daysDifference(m.plannedDate);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-red-500/[0.04] px-3 py-2 transition-colors hover:bg-red-500/[0.08]">
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-medium text-white/80 truncate">{m.name}</p>
                          {proj && <p className="text-xs text-white/25 truncate">{proj.projectName}</p>}
                        </div>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-red-400/70">{daysOverdue}d</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg bg-white/[0.02] py-5 text-xs text-emerald-400/50">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  All on track
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Clock className="h-3.5 w-3.5 text-orange-400/80" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-orange-400/70">Upcoming</span>
                <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs font-bold tabular-nums text-orange-400/80">{upcomingMilestones.length}</span>
              </div>
              {upcomingMilestones.length > 0 ? (
                <div className="max-h-[96px] overflow-y-auto space-y-1 pr-0.5">
                  {upcomingMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysUntil = -daysDifference(m.plannedDate);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]">
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-medium text-white/80 truncate">{m.name}</p>
                          {proj && <p className="text-xs text-white/25 truncate">{proj.projectName}</p>}
                        </div>
                        <span className={`shrink-0 text-xs font-bold tabular-nums ${daysUntil <= 7 ? "text-amber-400/70" : "text-white/30"}`}>
                          {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg bg-white/[0.02] py-5 text-xs text-white/20">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── E. Projects Table ── */}
      <div id="projects-section" className="overflow-hidden rounded-xl border border-border/20 bg-card/40 scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-orange-500/12 p-2">
              <FolderKanban className="h-4 w-4 text-orange-400" />
            </div>
            <span className="text-base font-bold text-foreground">Projects</span>
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {client.projects.length}
            </span>
          </div>
        </div>

        {client.projects.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Project</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">PM</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Value</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billed</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Progress</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {client.projects.map((project, idx) => {
                const done = countCompleted(project.milestones);
                const pct = completionPercent(project.milestones);
                const projBilled = sumUniqueInvoices(project.milestones);
                const projValue = Number(project.contractValue);
                const billedPct = projValue > 0 ? Math.round((projBilled / projValue) * 100) : 0;

                // Timeline
                const start = new Date(project.startDate);
                const end = new Date(project.endDate);
                const totalDur = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timePct = totalDur > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100))) : 0;

                // PM initials
                const pmInitials = getInitials(project.projectManager.name);

                return (
                  <tr
                    key={project.id}
                    className={`group transition-colors hover:bg-orange-500/[0.03] ${idx < client.projects.length - 1 ? "border-b border-border/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/projects/${project.id}`} className="flex items-center gap-2.5 text-[15px] font-semibold text-foreground hover:text-orange-400 transition-colors">
                        {project.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.imageUrl} alt="" className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-[10px] font-bold text-orange-400 ring-1 ring-orange-500/20 shrink-0">
                            {project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/project-managers/${project.projectManager.id}`} className="flex items-center gap-2 transition-colors hover:text-foreground/70">
                        {project.projectManager.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.projectManager.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-bold text-foreground/60 ring-1 ring-white/[0.08]">
                            {pmInitials}
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground/70">{project.projectManager.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground/80 whitespace-nowrap">
                      {projValue.toLocaleString("en-US", {
                        style: "currency",
                        currency: project.currency,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm tabular-nums text-foreground/70">${projBilled.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-muted-foreground/40">({billedPct}%)</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-orange-500/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground/60">{done}/{project.milestones.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className={`h-full rounded-full transition-all ${timePct >= 90 ? "bg-red-500/70" : timePct >= 70 ? "bg-amber-500/70" : "bg-blue-500/50"}`} style={{ width: `${timePct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground/50">{timePct}%</span>
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
          <div className="py-14 text-center text-sm text-muted-foreground/40">
            No projects yet.
          </div>
        )}
      </div>

      {/* ── F. Invoices Table ── */}
      <div id="invoices-section" className="overflow-hidden rounded-xl border border-border/20 bg-card/40 scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.06] p-2">
              <Receipt className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <span className="text-base font-bold text-foreground">Invoices</span>
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
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
                      className={`group transition-colors hover:bg-white/[0.03] ${
                        idx < invoices.length - 1 ? "border-b border-border/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-foreground/80">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground/70">
                        {inv.projectName}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground/80" title={inv.milestoneNames.join(", ")}>
                        {inv.milestoneNames[0]}
                        {inv.milestoneNames.length > 1 && (
                          <span className="ml-1 text-muted-foreground/60">+{inv.milestoneNames.length - 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        ${Number(inv.totalPayable).toLocaleString()}
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
                          <span className="text-muted-foreground/20">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary row */}
              <tfoot>
                <tr className="border-t border-border/20 bg-white/[0.02]">
                  <td className="px-6 py-3.5 text-sm font-bold text-foreground" colSpan={3}>Total</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-foreground">
                    ${invoiceTotalPayable.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 rounded-full bg-white/[0.04] p-3">
              <Receipt className="h-5 w-5 text-muted-foreground/25" />
            </div>
            <p className="text-sm text-muted-foreground/60">No invoices yet</p>
            <p className="mt-1 text-xs text-muted-foreground/40">Invoices will appear here once milestones are invoiced</p>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <div id="notes-section" className="scroll-mt-6">
        <NotesSection entityType="CLIENT" entityId={client.id} notes={serializeForClient(notes)} />
      </div>

      {/* ── G. Footer Info ── */}
      {(client.billingAddress || client.notes) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {client.billingAddress && (
            <div className="rounded-xl border border-border/15 bg-card/30 p-5 lg:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Billing Address</p>
              <p className="whitespace-pre-line text-sm text-foreground/70">{client.billingAddress}</p>
            </div>
          )}
          {client.notes && (
            <div className="rounded-xl border border-border/15 bg-card/30 p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Notes</p>
              <p className="whitespace-pre-line text-sm text-foreground/70">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="h-16" />

      <ClientFloatingActions
        client={serializeForClient(client)}
        countries={countries}
        notesCount={notes.length}
      />
    </div>
  );
}
